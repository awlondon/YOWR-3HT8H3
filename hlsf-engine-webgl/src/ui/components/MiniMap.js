import { createElement, clearElement } from '../ui-helpers.js';

export function mountMiniMap(container, map) {
  clearElement(container);
  const title = createElement('h2', { text: 'Mini Map' });
  container.appendChild(title);
  if (!map?.tokens) {
    container.appendChild(createElement('p', { text: 'No map yet.' }));
    return;
  }
  const canvas = createElement('canvas', { attrs: { width: '200', height: '160' } });
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const { minX, maxX, minY, maxY } = map.telemetry?.bounds ?? { minX: -100, maxX: 100, minY: -100, maxY: 100 };
  const scaleX = canvas.width / Math.max(1, maxX - minX);
  const scaleY = canvas.height / Math.max(1, maxY - minY);
  ctx.fillStyle = '#38e4ff';
  for (const token of map.tokens) {
    const x = (token.pos[0] - minX) * scaleX;
    const y = (token.pos[1] - minY) * scaleY;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  container.appendChild(canvas);
}
