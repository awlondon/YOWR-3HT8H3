import { createElement, clearElement } from '../ui-helpers.js';

export function mountTokenTable(container, map) {
  clearElement(container);
  const title = createElement('h2', { text: 'Tokens' });
  container.appendChild(title);
  if (!map?.tokens?.length) {
    container.appendChild(createElement('p', { text: 'No tokens yet.' }));
    return;
  }
  const table = createElement('table', { className: 'table' });
  const thead = createElement('thead');
  thead.innerHTML = '<tr><th>Glyph</th><th>Token</th><th>Weight</th></tr>';
  table.appendChild(thead);
  const tbody = createElement('tbody');
  for (const token of map.tokens.slice(0, 20)) {
    const row = createElement('tr');
    row.innerHTML = `<td>${token.glyph}</td><td>${token.text}</td><td>${token.weight?.toFixed?.(2) ?? ''}</td>`;
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}
