import { createElement, clearElement } from '../ui-helpers.js';

export function mountOutputPanel(container, map) {
  clearElement(container);
  const title = createElement('h2', { text: 'Output' });
  container.appendChild(title);
  if (!map?.formatted) {
    container.appendChild(createElement('p', { text: 'No output yet.' }));
    return;
  }
  const summary = createElement('p', { text: map.formatted.regionSummary });
  const list = createElement('ul');
  for (const bullet of map.formatted.bullets) {
    const li = createElement('li', { text: bullet });
    list.appendChild(li);
  }
  container.append(summary, list);
}
