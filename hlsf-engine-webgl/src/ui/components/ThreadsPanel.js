import { createElement, clearElement } from '../ui-helpers.js';

export function mountThreadsPanel(container, map) {
  clearElement(container);
  const title = createElement('h2', { text: 'Threads' });
  container.appendChild(title);
  if (!map?.threads?.length) {
    container.appendChild(createElement('p', { text: 'No threads yet.' }));
    return;
  }
  const list = createElement('ul');
  for (const thread of map.threads) {
    const li = createElement('li');
    const entries = thread.entries.slice(0, 3).map((e) => e.text).join(', ');
    li.textContent = `${thread.seed}: ${entries}`;
    list.appendChild(li);
  }
  container.appendChild(list);
}
