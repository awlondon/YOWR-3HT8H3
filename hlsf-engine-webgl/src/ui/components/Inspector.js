import { createElement, clearElement } from '../ui-helpers.js';

export function mountInspector(container, map) {
  clearElement(container);
  const title = createElement('h2', { text: 'Inspector' });
  container.appendChild(title);
  if (!map?.retrieval) {
    container.appendChild(createElement('p', { text: 'Hover over nodes to inspect.' }));
    return;
  }
  const list = createElement('ul');
  for (const line of map.retrieval.summary) {
    list.appendChild(createElement('li', { text: line }));
  }
  container.appendChild(list);
}
