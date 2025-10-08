import { createTexture, createFramebuffer } from './gl-utils.js';

export class PickingPass {
  constructor(gl, width, height, renderer) {
    this.gl = gl;
    this.renderer = renderer;
    this.texture = createTexture(gl, width, height, null);
    this.fbo = createFramebuffer(gl, this.texture);
    this.size = { width, height };
  }

  resize(width, height) {
    const gl = this.gl;
    this.size.width = width;
    this.size.height = height;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, null);
  }

  render() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.size.width, this.size.height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.renderer.drawScene({ picking: true });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  readPixel(x, y) {
    const gl = this.gl;
    const pixel = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.readPixels(x, this.size.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return pixel;
  }
}
