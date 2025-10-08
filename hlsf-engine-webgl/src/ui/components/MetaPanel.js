import { createElement, clearElement } from '../ui-helpers.js';

export function mountMetaPanel(container, map) {
  clearElement(container);
  const title = createElement('h2', { text: 'Telemetry' });
  container.appendChild(title);
  if (!map?.telemetry) {
    container.appendChild(createElement('p', { text: 'No telemetry yet.' }));
    return;
  }
  const list = createElement('ul');
  list.appendChild(createElement('li', { text: `Bounds: ${JSON.stringify(map.telemetry.bounds)}` }));
  list.appendChild(createElement('li', { text: `Mean Hue: ${map.telemetry.color.meanHue.toFixed(3)}` }));
  list.appendChild(createElement('li', { text: `Retrieval Size: ${map.telemetry.retrievalSize}` }));
  list.appendChild(createElement('li', { text: `Peak Attention: ${map.telemetry.peakAttention}` }));
  container.appendChild(list);
}
