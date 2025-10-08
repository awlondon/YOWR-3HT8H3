import { WebGLRenderer } from '../../renderer/renderer.js';
import { clearElement } from '../ui-helpers.js';

export function mountSpaceFieldGL(canvas, atlasCanvas, state, inspectorContainer) {
  const renderer = new WebGLRenderer(canvas, atlasCanvas);
  let needsRender = true;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  const schedule = () => {
    if (!needsRender) {
      needsRender = true;
      requestAnimationFrame(() => {
        needsRender = false;
        renderer.draw();
      });
    }
  };

  const unsubscribe = state.subscribe((current) => {
    if (current.map) {
      renderer.setMap(current.map);
      schedule();
      updateInspector(inspectorContainer, current.map);
    }
  });

  const handleResize = () => {
    renderer.resize();
    schedule();
  };
  window.addEventListener('resize', handleResize);

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    renderer.camera.zoom(-event.deltaY, event.offsetX, event.offsetY);
    schedule();
  }, { passive: false });

  canvas.addEventListener('mousedown', (event) => {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (event) => {
    if (isDragging) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.camera.pan(dx, -dy);
      schedule();
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    if (!state.current.map) return;
    const id = renderer.pick(event.offsetX * (window.devicePixelRatio || 1), event.offsetY * (window.devicePixelRatio || 1));
    if (id) {
      const item = findItemById(state.current.map, id);
      if (item) {
        canvas.setAttribute('aria-label', `Focused ${item.text ?? item.id}`);
      }
    }
  });

  return () => {
    unsubscribe();
    window.removeEventListener('resize', handleResize);
  };
}

function findItemById(map, id) {
  return map.tokens?.find((t) => t.id === id)
    || map.expansions?.find((e) => e.id === id)
    || map.triangles?.find((t) => t.id === id);
}

function updateInspector(container, map) {
  clearElement(container);
  const title = document.createElement('h2');
  title.textContent = 'Inspector';
  container.appendChild(title);
  if (!map?.retrieval) return;
  const list = document.createElement('ul');
  for (const line of map.retrieval.summary) {
    const li = document.createElement('li');
    li.textContent = line;
    list.appendChild(li);
  }
  container.appendChild(list);
}
