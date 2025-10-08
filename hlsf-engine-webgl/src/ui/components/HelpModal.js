import { createElement, clearElement } from '../ui-helpers.js';

export function mountHelpModal(container, button) {
  clearElement(container);
  const dialog = createElement('div', { className: 'dialog' });
  dialog.innerHTML = `
    <h2>Space Field Help</h2>
    <p>Use the mouse wheel or +/- keys to zoom, click and drag to pan. Hover nodes for details.</p>
    <button type="button" id="closeHelp">Close</button>
  `;
  container.appendChild(dialog);
  const close = dialog.querySelector('#closeHelp');
  const toggle = () => {
    const hidden = container.hasAttribute('hidden');
    if (hidden) {
      container.removeAttribute('hidden');
      close.focus();
    } else {
      container.setAttribute('hidden', '');
      button.focus();
    }
  };
  button.addEventListener('click', toggle);
  close.addEventListener('click', toggle);
  container.addEventListener('click', (event) => {
    if (event.target === container) toggle();
  });
}
