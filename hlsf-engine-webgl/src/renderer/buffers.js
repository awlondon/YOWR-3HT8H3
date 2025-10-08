import { createBuffer, createIndexBuffer, createUnitQuad } from './gl-utils.js';

const NODE_STRIDE = 8 * 4;
const GLYPH_STRIDE = 12 * 4;
const TRIANGLE_VERTEX_STRIDE = 7 * 4;
const LINE_VERTEX_STRIDE = 7 * 4;

export class BufferManager {
  constructor(gl) {
    this.gl = gl;
    this.unitQuad = createUnitQuad(gl);

    this.nodeBuffer = gl.createBuffer();
    this.nodeCapacity = 0;
    this.nodeCount = 0;
    this.nodePickBuffer = gl.createBuffer();

    this.glyphBuffer = gl.createBuffer();
    this.glyphCapacity = 0;
    this.glyphCount = 0;

    this.triangleBuffer = gl.createBuffer();
    this.trianglePickBuffer = gl.createBuffer();
    this.triangleIndexBuffer = gl.createBuffer();
    this.triangleCapacity = 0;
    this.triangleCount = 0;

    this.lineBuffer = gl.createBuffer();
    this.lineCapacity = 0;
    this.lineCount = 0;

    this.pickIdMap = new Map();
    this.pickColorMap = new Map();
  }

  getUnitQuad() {
    return this.unitQuad;
  }

  encodeId(id) {
    if (!this.pickIdMap.has(id)) {
      const index = this.pickIdMap.size + 1;
      this.pickIdMap.set(id, index);
      this.pickColorMap.set(id, encodePickId(index).map((c) => c / 255));
    }
    return this.pickIdMap.get(id);
  }

  decodeColor(r, g, b) {
    for (const [key, value] of this.pickIdMap) {
      const encoded = encodePickId(value);
      if (encoded[0] === r && encoded[1] === g && encoded[2] === b) {
        return key;
      }
    }
    return null;
  }

  update(map, glyphAtlas) {
    const gl = this.gl;
    this.pickIdMap.clear();

    const allNodes = [...(map.tokens ?? []), ...(map.expansions ?? [])];
    this.nodeCount = allNodes.length;
    const nodeArray = new Float32Array(this.nodeCount * 8);
    const glyphArray = new Float32Array(this.nodeCount * 12);
    const pickNodeArray = new Float32Array(this.nodeCount * 8);

    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i];
      const base = i * 8;
      const color = node.rgb ?? [0.3, 0.6, 0.9];
      const radius = node.radius ?? 24;
      nodeArray[base + 0] = node.pos?.[0] ?? 0;
      nodeArray[base + 1] = node.pos?.[1] ?? 0;
      nodeArray[base + 2] = radius;
      nodeArray[base + 3] = 0.2;
      nodeArray[base + 4] = color[0];
      nodeArray[base + 5] = color[1];
      nodeArray[base + 6] = color[2];
      nodeArray[base + 7] = 1.0;

      const pickColor = this.pickColorMap.get(node.id) ?? [0, 0, 0];
      pickNodeArray[base + 0] = nodeArray[base + 0];
      pickNodeArray[base + 1] = nodeArray[base + 1];
      pickNodeArray[base + 2] = nodeArray[base + 2];
      pickNodeArray[base + 3] = nodeArray[base + 3];
      pickNodeArray[base + 4] = pickColor[0];
      pickNodeArray[base + 5] = pickColor[1];
      pickNodeArray[base + 6] = pickColor[2];
      pickNodeArray[base + 7] = 1.0;

      const glyphBase = i * 12;
      const uv = glyphAtlas?.glyphMap?.get(node.glyph) ?? { u0: 0, v0: 0, u1: 1, v1: 1 };
      glyphArray[glyphBase + 0] = node.pos?.[0] ?? 0;
      glyphArray[glyphBase + 1] = node.pos?.[1] ?? 0;
      glyphArray[glyphBase + 2] = radius * 0.9;
      glyphArray[glyphBase + 3] = 0.25;
      glyphArray[glyphBase + 4] = color[0];
      glyphArray[glyphBase + 5] = color[1];
      glyphArray[glyphBase + 6] = color[2];
      glyphArray[glyphBase + 7] = 1.0;
      glyphArray[glyphBase + 8] = uv.u0;
      glyphArray[glyphBase + 9] = uv.v0;
      glyphArray[glyphBase + 10] = uv.u1;
      glyphArray[glyphBase + 11] = uv.v1;

      this.encodeId(node.id);
    }

    this.nodeCapacity = this.nodeCount;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nodeArray, gl.DYNAMIC_DRAW);

    this.glyphCapacity = this.nodeCount;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glyphBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, glyphArray, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.nodePickBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pickNodeArray, gl.DYNAMIC_DRAW);

    this.updateTriangles(map);
    this.updateLines(map, allNodes);
  }

  updateTriangles(map) {
    const gl = this.gl;
    const triangles = map.triangles ?? [];
    this.triangleCount = triangles.length;
    const vertexArray = new Float32Array(triangles.length * 3 * 7);
    const pickArray = new Float32Array(triangles.length * 3 * 7);
    const indices = new Uint16Array(triangles.length * 3);

    const posLookup = new Map();
    for (const token of map.tokens ?? []) posLookup.set(token.id, token.pos ?? [0, 0]);
    for (const exp of map.expansions ?? []) posLookup.set(exp.id, exp.pos ?? [0, 0]);

    for (let i = 0; i < triangles.length; i++) {
      const tri = triangles[i];
      const color = tri.rgb ?? [0.2, 0.2, 0.2];
      for (let j = 0; j < 3; j++) {
        const id = tri.nodes[j];
        const pos = posLookup.get(id) ?? [0, 0];
        const base = (i * 3 + j) * 7;
        vertexArray[base + 0] = pos[0];
        vertexArray[base + 1] = pos[1];
        vertexArray[base + 2] = -0.6;
        vertexArray[base + 3] = color[0];
        vertexArray[base + 4] = color[1];
        vertexArray[base + 5] = color[2];
        vertexArray[base + 6] = tri.alpha ?? 0.3;
        const pickColor = this.pickColorMap.get(tri.id) ?? [0, 0, 0];
        pickArray[base + 0] = vertexArray[base + 0];
        pickArray[base + 1] = vertexArray[base + 1];
        pickArray[base + 2] = vertexArray[base + 2];
        pickArray[base + 3] = pickColor[0];
        pickArray[base + 4] = pickColor[1];
        pickArray[base + 5] = pickColor[2];
        pickArray[base + 6] = 1.0;
        indices[i * 3 + j] = i * 3 + j;
        this.encodeId(tri.id);
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglePickBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pickArray, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
  }

  updateLines(map, nodes) {
    const gl = this.gl;
    const edges = map.edges ?? [];
    this.lineCount = edges.length;
    const vertexArray = new Float32Array(edges.length * 6 * 7);

    const lookup = new Map(nodes.map((node) => [node.id, node]));

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const a = lookup.get(edge.a);
      const b = lookup.get(edge.b);
      const ax = a?.pos?.[0] ?? 0;
      const ay = a?.pos?.[1] ?? 0;
      const bx = b?.pos?.[0] ?? 0;
      const by = b?.pos?.[1] ?? 0;
      const color = [0.2, 0.6, 0.9, 0.25];
      const width = 6;
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len * width;
      const ny = dx / len * width;
      const verts = [
        ax - nx, ay - ny,
        ax + nx, ay + ny,
        bx - nx, by - ny,
        bx + nx, by + ny
      ];
      const baseIndex = i * 6;
      const triangles = [0, 1, 2, 2, 1, 3];
      for (let j = 0; j < 6; j++) {
        const vertex = triangles[j];
        const base = (baseIndex + j) * 7;
        vertexArray[base + 0] = verts[vertex * 2];
        vertexArray[base + 1] = verts[vertex * 2 + 1];
        vertexArray[base + 2] = -0.4;
        vertexArray[base + 3] = color[0];
        vertexArray[base + 4] = color[1];
        vertexArray[base + 5] = color[2];
        vertexArray[base + 6] = color[3];
      }
      this.encodeId(`${edge.a}->${edge.b}`);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW);
  }
}

export function encodePickId(id) {
  const r = (id >> 16) & 0xff;
  const g = (id >> 8) & 0xff;
  const b = id & 0xff;
  return [r, g, b];
}
