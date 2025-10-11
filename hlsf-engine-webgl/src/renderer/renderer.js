import { createProgram, createUnitQuad } from './gl-utils.js';
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

function initProgram(gl, vert, frag, attribs){
  const program = createProgram(gl, vert, frag);
  const attribLocations = {};
  for(const name of attribs){ attribLocations[name] = gl.getAttribLocation(program, name); }
  return {
    program,
    attribs: attribLocations,
    uniforms: {
      u_view: gl.getUniformLocation(program, 'u_view'),
      u_proj: gl.getUniformLocation(program, 'u_proj'),
      u_atlas: gl.getUniformLocation(program, 'u_atlas'),
    }
  };
}

export class Renderer{
  constructor(gl){
    this.gl = gl;
    this.canvas = gl.canvas;
    this.camera = new Camera2D();
    this.programs = {
      nodes: initProgram(gl, NODES_VERT, NODES_FRAG, ['a_pos','i_world','i_radius','i_z','i_color']),
      triangles: initProgram(gl, TRIANGLES_VERT, TRIANGLES_FRAG, ['a_world','a_z','a_color']),
      lines: initProgram(gl, LINES_VERT, LINES_FRAG, ['a_world','a_z','a_color']),
      glyphs: initProgram(gl, GLYPHS_VERT, GLYPHS_FRAG, ['a_pos','i_world','i_size','i_z','i_color','i_uv'])
    };
    this.unitQuad = createUnitQuad(gl);
    this.buffers = {
      nodes: gl.createBuffer(),
      nodePick: gl.createBuffer(),
      glyphs: gl.createBuffer(),
      triangles: gl.createBuffer(),
      trianglePick: gl.createBuffer(),
      lines: gl.createBuffer(),
    };
    this.counts = { nodes:0, glyphs:0, triangles:0, lines:0 };
    this.cachedBundle = null;
    const atlasCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : { getContext: () => null };
    this.glyphAtlas = buildGlyphAtlas(gl, atlasCanvas);
    this.pickPass = new PickingPass(gl, this.canvas.width || 1, this.canvas.height || 1, this);
    this.pick = { decode: () => null };
  }

  getGlyphAtlas(){ return this.glyphAtlas; }

  resize(width, height, dpr=1){
    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    this.camera.setViewport(width / dpr, height / dpr, dpr);
    this.pickPass.resize(width, height);
  }

  pan(dx, dy){
    this.camera.pan(dx, dy);
  }

  zoom(delta, x, y){
    this.camera.zoom(delta, x, y);
  }

  upload(bundle){
    const gl = this.gl;
    if(bundle.nodes){
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.nodes);
      gl.bufferData(gl.ARRAY_BUFFER, bundle.nodes.array, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.nodePick);
      gl.bufferData(gl.ARRAY_BUFFER, bundle.nodes.pick, gl.DYNAMIC_DRAW);
      this.counts.nodes = bundle.nodes.count;
    }
    if(bundle.glyphs){
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.glyphs);
      gl.bufferData(gl.ARRAY_BUFFER, bundle.glyphs.array, gl.DYNAMIC_DRAW);
      this.counts.glyphs = bundle.glyphs.count;
    }
    if(bundle.triangles){
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.triangles);
      gl.bufferData(gl.ARRAY_BUFFER, bundle.triangles.array, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.trianglePick);
      gl.bufferData(gl.ARRAY_BUFFER, bundle.triangles.pick, gl.DYNAMIC_DRAW);
      this.counts.triangles = bundle.triangles.count;
    }
    if(bundle.lines){
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.lines);
      gl.bufferData(gl.ARRAY_BUFFER, bundle.lines.array, gl.DYNAMIC_DRAW);
      this.counts.lines = bundle.lines.count;
    }
    this.pick = bundle.pick || { decode: () => null };
  }

  draw(bundle){
    if(bundle){
      this.cachedBundle = bundle;
      this.upload(bundle);
    }
    if(!this.cachedBundle) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.02, 0.02, 0.07, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.drawScene({ picking: false });
  }

  drawScene({ picking }){
    const gl = this.gl;
    const bundle = this.cachedBundle;
    if(!bundle) return;
    const view = new Float32Array(this.camera.viewMatrix);
    const proj = new Float32Array(this.camera.projMatrix);

    this.drawTriangles(view, proj, picking);
    if(!picking) this.drawLines(view, proj);
    this.drawNodes(view, proj, picking);
    if(!picking) this.drawGlyphs(view, proj);
  }

  drawTriangles(view, proj, picking){
    const gl = this.gl;
    const program = this.programs.triangles;
    const count = this.counts.triangles;
    if(!count) return;
    gl.useProgram(program.program);
    if(program.uniforms.u_view) gl.uniformMatrix3fv(program.uniforms.u_view, false, view);
    if(program.uniforms.u_proj) gl.uniformMatrix3fv(program.uniforms.u_proj, false, proj);
    gl.bindBuffer(gl.ARRAY_BUFFER, picking ? this.buffers.trianglePick : this.buffers.triangles);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(program.attribs.a_world);
    gl.vertexAttribPointer(program.attribs.a_world, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(program.attribs.a_z);
    gl.vertexAttribPointer(program.attribs.a_z, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(program.attribs.a_color);
    gl.vertexAttribPointer(program.attribs.a_color, 4, gl.FLOAT, false, stride, 3 * 4);
    gl.drawArrays(gl.TRIANGLES, 0, count * 3);
  }

  drawLines(view, proj){
    const gl = this.gl;
    const program = this.programs.lines;
    const count = this.counts.lines;
    if(!count) return;
    gl.useProgram(program.program);
    if(program.uniforms.u_view) gl.uniformMatrix3fv(program.uniforms.u_view, false, view);
    if(program.uniforms.u_proj) gl.uniformMatrix3fv(program.uniforms.u_proj, false, proj);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.lines);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(program.attribs.a_world);
    gl.vertexAttribPointer(program.attribs.a_world, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(program.attribs.a_z);
    gl.vertexAttribPointer(program.attribs.a_z, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(program.attribs.a_color);
    gl.vertexAttribPointer(program.attribs.a_color, 4, gl.FLOAT, false, stride, 3 * 4);
    gl.drawArrays(gl.TRIANGLES, 0, count * 6);
  }

  drawNodes(view, proj, picking){
    const gl = this.gl;
    const program = this.programs.nodes;
    const count = this.counts.nodes;
    if(!count) return;
    gl.useProgram(program.program);
    if(program.uniforms.u_view) gl.uniformMatrix3fv(program.uniforms.u_view, false, view);
    if(program.uniforms.u_proj) gl.uniformMatrix3fv(program.uniforms.u_proj, false, proj);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.unitQuad);
    gl.enableVertexAttribArray(program.attribs.a_pos);
    gl.vertexAttribPointer(program.attribs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(program.attribs.a_pos, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, picking ? this.buffers.nodePick : this.buffers.nodes);
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
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
  }

  drawGlyphs(view, proj){
    const gl = this.gl;
    const program = this.programs.glyphs;
    const count = this.counts.glyphs;
    if(!count) return;
    gl.useProgram(program.program);
    if(program.uniforms.u_view) gl.uniformMatrix3fv(program.uniforms.u_view, false, view);
    if(program.uniforms.u_proj) gl.uniformMatrix3fv(program.uniforms.u_proj, false, proj);
    if(program.uniforms.u_atlas) gl.uniform1i(program.uniforms.u_atlas, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.glyphAtlas.texture);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.unitQuad);
    gl.enableVertexAttribArray(program.attribs.a_pos);
    gl.vertexAttribPointer(program.attribs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(program.attribs.a_pos, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.glyphs);
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
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
  }

  pick(x, y, bundle){
    if(bundle && bundle !== this.cachedBundle){
      this.cachedBundle = bundle;
      this.upload(bundle);
    }
    if(!this.cachedBundle) return null;
    this.pickPass.render();
    const pixel = this.pickPass.readPixel(Math.round(x), Math.round(y));
    const sel = this.pick.decode(pixel[0], pixel[1], pixel[2]);
    return sel ? { ...sel } : null;
  }
}
