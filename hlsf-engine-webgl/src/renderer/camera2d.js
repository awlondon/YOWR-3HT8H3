export class Camera2D {
  constructor() {
    this.position = { x: 0, y: 0 };
    this.scale = 1;
    this.viewport = { width: 1, height: 1, dpr: 1 };
    this.viewMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    this.projMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  setViewport(width, height, dpr = window.devicePixelRatio || 1) {
    this.viewport.width = width;
    this.viewport.height = height;
    this.viewport.dpr = dpr;
    this.updateProjection();
  }

  fitBounds(bounds) {
    const w = bounds.maxX - bounds.minX || 1;
    const h = bounds.maxY - bounds.minY || 1;
    const scaleX = this.viewport.width / w;
    const scaleY = this.viewport.height / h;
    this.scale = Math.min(scaleX, scaleY) * 0.5;
    this.position.x = -(bounds.minX + bounds.maxX) / 2;
    this.position.y = -(bounds.minY + bounds.maxY) / 2;
    this.updateView();
  }

  pan(dx, dy) {
    this.position.x += dx / this.scale;
    this.position.y += dy / this.scale;
    this.updateView();
  }

  zoom(delta, cx, cy) {
    const zoomFactor = Math.exp(delta * 0.001);
    const before = this.screenToWorld(cx, cy);
    this.scale *= zoomFactor;
    this.updateView();
    const after = this.screenToWorld(cx, cy);
    this.position.x += before.x - after.x;
    this.position.y += before.y - after.y;
    this.updateView();
  }

  updateView() {
    const { x, y } = this.position;
    this.viewMatrix = [
      this.scale, 0, 0,
      0, this.scale, 0,
      x * this.scale, y * this.scale, 1
    ];
  }

  updateProjection() {
    const { width, height, dpr } = this.viewport;
    const w = width * dpr;
    const h = height * dpr;
    const sx = 2 / w;
    const sy = -2 / h;
    this.projMatrix = [
      sx, 0, 0,
      0, sy, 0,
      -1, 1, 1
    ];
  }

  screenToWorld(x, y) {
    const invScale = 1 / this.scale;
    return {
      x: (x - this.viewport.width / 2) * invScale - this.position.x,
      y: (y - this.viewport.height / 2) * invScale - this.position.y
    };
  }
}
