import { getGLContext, createProgram, resizeCanvas } from './gl-utils.js';
import { BufferManager, encodePickId } from './buffers.js';
import { buildGlyphAtlas } from './atlas.js';
import { Camera2D } from './camera2d.js';
import { PickingPass } from './picking.js';
import { NODES_VERT } from './programs/nodes.vert.glsl.js';
import { NODES_FRAG } from './programs/nodes.frag.glsl.js';
import { TRIANGLES_VERT } from './programs/triangles.vert.glsl.js';
import { TRIANGLES_FRAG } from './programs/triangles.frag.glsl.js';
import { LINES_VERT } from './programs/lines.vert.glsl.js';
import { LINES_FRAG } from './programs/lines.frag.glsl.js';
import { GLYPHS_VERT } from './programs/glyphs.vert.glsl.js';
import { GLYPHS_FRAG } from './programs/glyphs.frag.glsl.js';

export class WebGLRenderer {
  constructor(canvas, atlasCanvas) {
    this.canvas = canvas;
    this.gl = getGLContext(canvas);
    this.camera = new Camera2D();
    this.buffers = new BufferManager(this.gl);
    this.programs = this.createPrograms();
    this.glyphAtlas = buildGlyphAtlas(this.gl, atlasCanvas);
    this.pick = new PickingPass(this.gl, canvas.width, canvas.height, this);
    this.currentMap = null;
    this.resize();
  }

  createPrograms() {
    const gl = this.gl;
    const create = (vert, frag, attribs) => {
      const program = createProgram(gl, vert, frag);
      const locations = {
        program,
        attribs: {},
        uniforms: {
          u_view: gl.getUniformLocation(program, 'u_view'),
          u_proj: gl.getUniformLocation(program, 'u_proj'),
          u_atlas: gl.getUniformLocation(program, 'u_atlas')
        }
      };
      for (const name of attribs) {
        locations.attribs[name] = gl.getAttribLocation(program, name);
      }
      return locations;
    };
    return {
      nodes: create(NODES_VERT, NODES_FRAG, ['a_pos', 'i_world', 'i_radius', 'i_z', 'i_color']),
      triangles: create(TRIANGLES_VERT, TRIANGLES_FRAG, ['a_world', 'a_z', 'a_color']),
      lines: create(LINES_VERT, LINES_FRAG, ['a_world', 'a_z', 'a_color']),
      glyphs: create(GLYPHS_VERT, GLYPHS_FRAG, ['a_pos', 'i_world', 'i_size', 'i_z', 'i_color', 'i_uv'])
    };
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(this.canvas.clientWidth * dpr) || this.canvas.width;
    const height = Math.floor(this.canvas.clientHeight * dpr) || this.canvas.height;
    resizeCanvas(this.canvas, width, height);
    this.gl.viewport(0, 0, width, height);
    this.camera.setViewport(this.canvas.clientWidth || width / dpr, this.canvas.clientHeight || height / dpr, dpr);
    this.pick.resize(width, height);
  }

  setMap(map) {
    this.currentMap = map;
    if (map?.telemetry?.bounds) {
      this.camera.fitBounds(map.telemetry.bounds);
    }
    this.buffers.update(map, this.glyphAtlas);
  }

  draw() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.02, 0.02, 0.07, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.drawScene({ picking: false });
  }

  drawScene({ picking }) {
    const gl = this.gl;
    const map = this.currentMap;
    if (!map) return;
    const view = new Float32Array(this.camera.viewMatrix);
    const proj = new Float32Array(this.camera.projMatrix);

    this.drawTriangles(view, proj, picking);
    if (!picking) this.drawLines(view, proj);
    this.drawNodes(view, proj, picking);
    if (!picking) this.drawGlyphs(view, proj);
  }

  drawTriangles(view, proj, picking) {
    const gl = this.gl;
    const program = this.programs.triangles;
    gl.useProgram(program.program);
    if (program.uniforms.u_view) gl.uniformMatrix3fv(program.uniforms.u_view, false, view);
    if (program.uniforms.u_proj) gl.uniformMatrix3fv(program.uniforms.u_proj, false, proj);

    gl.bindBuffer(gl.ARRAY_BUFFER, picking ? this.buffers.trianglePickBuffer : this.buffers.triangleBuffer);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(program.attribs.a_world);
    gl.vertexAttribPointer(program.attribs.a_world, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(program.attribs.a_z);
    gl.vertexAttribPointer(program.attribs.a_z, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(program.attribs.a_color);
    gl.vertexAttribPointer(program.attribs.a_color, 4, gl.FLOAT, false, stride, 3 * 4);

    gl.drawArrays(gl.TRIANGLES, 0, this.buffers.triangleCount * 3);
  }

  drawLines(view, proj) {
    const gl = this.gl;
    const program = this.programs.lines;
    gl.useProgram(program.program);
    if (program.uniforms.u_view) gl.uniformMatrix3fv(program.uniforms.u_view, false, view);
    if (program.uniforms.u_proj) gl.uniformMatrix3fv(program.uniforms.u_proj, false, proj);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.lineBuffer);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(program.attribs.a_world);
    gl.vertexAttribPointer(program.attribs.a_world, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(program.attribs.a_z);
    gl.vertexAttribPointer(program.attribs.a_z, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(program.attribs.a_color);
    gl.vertexAttribPointer(program.attribs.a_color, 4, gl.FLOAT, false, stride, 3 * 4);

    gl.drawArrays(gl.TRIANGLES, 0, this.buffers.lineCount * 6);
  }

  drawNodes(view, proj, picking) {
    const gl = this.gl;
    const program = this.programs.nodes;
    gl.useProgram(program.program);
    if (program.uniforms.u_view) gl.uniformMatrix3fv(program.uniforms.u_view, false, view);
    if (program.uniforms.u_proj) gl.uniformMatrix3fv(program.uniforms.u_proj, false, proj);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.getUnitQuad());
    gl.enableVertexAttribArray(program.attribs.a_pos);
    gl.vertexAttribPointer(program.attribs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(program.attribs.a_pos, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, picking ? this.buffers.nodePickBuffer : this.buffers.nodeBuffer);
    const stride = 8 * 4;
    gl.enableVertexAttribArray(program.attribs.i_world);
    gl.vertexAttribPointer(program.attribs.i_world, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(program.attribs.i_world, 1);
    gl.enableVertexAttribArray(program.attribs.i_radius);
    gl.vertexAttribPointer(program.attribs.i_radius, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.vertexAttribDivisor(program.attribs.i_radius, 1);
    gl.enableVertexAttribArray(program.attribs.i_z);
    gl.vertexAttribPointer(program.attribs.i_z, 1, gl.FLOAT, false, stride, 3 * 4);
    gl.vertexAttribDivisor(program.attribs.i_z, 1);
    gl.enableVertexAttribArray(program.attribs.i_color);
    gl.vertexAttribPointer(program.attribs.i_color, 4, gl.FLOAT, false, stride, 4 * 4);
    gl.vertexAttribDivisor(program.attribs.i_color, 1);

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.buffers.nodeCount);
  }

  drawGlyphs(view, proj) {
    const gl = this.gl;
    const program = this.programs.glyphs;
    gl.useProgram(program.program);
    if (program.uniforms.u_view) gl.uniformMatrix3fv(program.uniforms.u_view, false, view);
    if (program.uniforms.u_proj) gl.uniformMatrix3fv(program.uniforms.u_proj, false, proj);
    if (program.uniforms.u_atlas) gl.uniform1i(program.uniforms.u_atlas, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.glyphAtlas.texture);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.getUnitQuad());
    gl.enableVertexAttribArray(program.attribs.a_pos);
    gl.vertexAttribPointer(program.attribs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(program.attribs.a_pos, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.glyphBuffer);
    const stride = 12 * 4;
    gl.enableVertexAttribArray(program.attribs.i_world);
    gl.vertexAttribPointer(program.attribs.i_world, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(program.attribs.i_world, 1);
    gl.enableVertexAttribArray(program.attribs.i_size);
    gl.vertexAttribPointer(program.attribs.i_size, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.vertexAttribDivisor(program.attribs.i_size, 1);
    gl.enableVertexAttribArray(program.attribs.i_z);
    gl.vertexAttribPointer(program.attribs.i_z, 1, gl.FLOAT, false, stride, 3 * 4);
    gl.vertexAttribDivisor(program.attribs.i_z, 1);
    gl.enableVertexAttribArray(program.attribs.i_color);
    gl.vertexAttribPointer(program.attribs.i_color, 4, gl.FLOAT, false, stride, 4 * 4);
    gl.vertexAttribDivisor(program.attribs.i_color, 1);
    gl.enableVertexAttribArray(program.attribs.i_uv);
    gl.vertexAttribPointer(program.attribs.i_uv, 4, gl.FLOAT, false, stride, 8 * 4);
    gl.vertexAttribDivisor(program.attribs.i_uv, 1);

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.buffers.glyphCapacity);
  }

  pick(x, y) {
    this.pick.render();
    const pixel = this.pick.readPixel(x, y);
    return this.buffers.decodeColor(pixel[0], pixel[1], pixel[2]);
  }
}
