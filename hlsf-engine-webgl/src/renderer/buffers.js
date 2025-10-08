const NODE_STRIDE = 8;
const GLYPH_STRIDE = 12;
const TRIANGLE_STRIDE = 7;
const LINE_STRIDE = 7;

function clamp01(v){ return Math.min(1, Math.max(0, v)); }

function encodePickId(id){
  const r = (id >> 16) & 0xff;
  const g = (id >> 8) & 0xff;
  const b = id & 0xff;
  return [r / 255, g / 255, b / 255];
}

export function buildInstanceBuffers(gl, map, { selectionId = null, glyphAtlas } = {}){
  const tokens = map?.tokens ?? [];
  const expansions = map?.expansions ?? [];
  const triangles = map?.triangles ?? [];
  const edges = map?.edges ?? [];

  const allNodes = [
    ...tokens.map(node => ({ ...node, __type: 'token' })),
    ...expansions.map(node => ({ ...node, __type: 'expansion' })),
  ];
  const pickEntries = new Map();
  let pickCounter = 1;
  const registerPick = (entry)=>{
    const id = pickCounter++;
    pickEntries.set(id, entry);
    return id;
  };

  const nodeArray = new Float32Array(allNodes.length * NODE_STRIDE);
  const nodePickArray = new Float32Array(allNodes.length * NODE_STRIDE);
  const glyphArray = new Float32Array(allNodes.length * GLYPH_STRIDE);

  const glyphMap = glyphAtlas?.glyphMap ?? new Map();

  const byId = new Map();
  for(const node of allNodes){ byId.set(node.id, node); }

  for(let i=0;i<allNodes.length;i++){
    const node = allNodes[i];
    const base = i * NODE_STRIDE;
    const glyphBase = i * GLYPH_STRIDE;
    const pos = node.pos ?? [0,0];
    const radius = node.radius ?? 24;
    const rawColor = node.rgb ?? [0.2, 0.6, 0.9];
    const color = rawColor.map((c)=> c > 1 ? c/255 : c);
    const highlight = selectionId && selectionId === node.id;
    const boosted = highlight ? color.map((c)=> clamp01(c * 1.35)) : color;
    const alpha = highlight ? 1 : (node.alpha ?? 0.9);
    const pickId = registerPick({ type: node.__type, data: node });
    const pickColor = encodePickId(pickId);

    nodeArray[base + 0] = pos[0];
    nodeArray[base + 1] = pos[1];
    nodeArray[base + 2] = radius;
    nodeArray[base + 3] = highlight ? 0.1 : 0.25;
    nodeArray[base + 4] = boosted[0];
    nodeArray[base + 5] = boosted[1];
    nodeArray[base + 6] = boosted[2];
    nodeArray[base + 7] = alpha;

    nodePickArray[base + 0] = pos[0];
    nodePickArray[base + 1] = pos[1];
    nodePickArray[base + 2] = radius;
    nodePickArray[base + 3] = highlight ? 0.1 : 0.25;
    nodePickArray[base + 4] = pickColor[0];
    nodePickArray[base + 5] = pickColor[1];
    nodePickArray[base + 6] = pickColor[2];
    nodePickArray[base + 7] = 1;

    const uv = glyphMap.get(node.glyph) ?? { u0: 0, v0: 0, u1: 1, v1: 1 };
    glyphArray[glyphBase + 0] = pos[0];
    glyphArray[glyphBase + 1] = pos[1];
    glyphArray[glyphBase + 2] = radius * 0.9;
    glyphArray[glyphBase + 3] = 0.2;
    glyphArray[glyphBase + 4] = boosted[0];
    glyphArray[glyphBase + 5] = boosted[1];
    glyphArray[glyphBase + 6] = boosted[2];
    glyphArray[glyphBase + 7] = 1;
    glyphArray[glyphBase + 8] = uv.u0;
    glyphArray[glyphBase + 9] = uv.v0;
    glyphArray[glyphBase + 10] = uv.u1;
    glyphArray[glyphBase + 11] = uv.v1;
  }

  const triangleArray = new Float32Array(Math.max(1, triangles.length) * 3 * TRIANGLE_STRIDE);
  const trianglePickArray = new Float32Array(Math.max(1, triangles.length) * 3 * TRIANGLE_STRIDE);
  for(let i=0;i<triangles.length;i++){
    const tri = triangles[i];
    const nodes = tri.nodes || [];
    const color = (tri.rgb ?? [0.4,0.4,0.7]).map((c)=> c>1 ? c/255 : c);
    const highlight = selectionId && selectionId === tri.id;
    const boosted = highlight ? color.map((c)=> clamp01(c*1.35)) : color;
    const alpha = highlight ? 0.85 : (tri.alpha ?? 0.45);
    const pickId = registerPick({ type: 'triangle', data: tri });
    const pickColor = encodePickId(pickId);
    for(let j=0;j<3;j++){
      const vertex = nodes[j];
      const pos = byId.get(vertex)?.pos ?? [0,0];
      const base = (i*3 + j) * TRIANGLE_STRIDE;
      triangleArray[base + 0] = pos[0];
      triangleArray[base + 1] = pos[1];
      triangleArray[base + 2] = -0.6;
      triangleArray[base + 3] = boosted[0];
      triangleArray[base + 4] = boosted[1];
      triangleArray[base + 5] = boosted[2];
      triangleArray[base + 6] = alpha;
      trianglePickArray[base + 0] = pos[0];
      trianglePickArray[base + 1] = pos[1];
      trianglePickArray[base + 2] = -0.6;
      trianglePickArray[base + 3] = pickColor[0];
      trianglePickArray[base + 4] = pickColor[1];
      trianglePickArray[base + 5] = pickColor[2];
      trianglePickArray[base + 6] = 1;
    }
  }

  const lineArray = new Float32Array(Math.max(1, edges.length) * 6 * LINE_STRIDE);
  for(let i=0;i<edges.length;i++){
    const edge = edges[i];
    const a = byId.get(edge.a);
    const b = byId.get(edge.b);
    const ax = a?.pos?.[0] ?? 0;
    const ay = a?.pos?.[1] ?? 0;
    const bx = b?.pos?.[0] ?? 0;
    const by = b?.pos?.[1] ?? 0;
    const width = edge.width ?? 4;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * width;
    const ny = dx / len * width;
    const verts = [
      ax - nx, ay - ny,
      ax + nx, ay + ny,
      bx - nx, by - ny,
      bx + nx, by + ny,
    ];
    const idx = [0,1,2,2,1,3];
    const color = (edge.rgb ?? [0.3,0.6,0.9,0.35]).map((component, componentIndex)=> componentIndex < 3 && component > 1 ? component/255 : component);
    for(let j=0;j<6;j++){
      const id = idx[j];
      const base = (i*6 + j) * LINE_STRIDE;
      lineArray[base + 0] = verts[id*2];
      lineArray[base + 1] = verts[id*2+1];
      lineArray[base + 2] = -0.4;
      lineArray[base + 3] = color[0];
      lineArray[base + 4] = color[1];
      lineArray[base + 5] = color[2];
      lineArray[base + 6] = color[3] ?? 0.35;
    }
  }

  const decode = (r, g, b)=>{
    const id = (r << 16) | (g << 8) | b;
    return pickEntries.get(id) ?? null;
  };

  return {
    nodes: { array: nodeArray, pick: nodePickArray, count: allNodes.length },
    glyphs: { array: glyphArray, count: allNodes.length },
    triangles: { array: triangleArray, pick: trianglePickArray, count: triangles.length },
    lines: { array: lineArray, count: edges.length },
    pick: { decode }
  };
}
