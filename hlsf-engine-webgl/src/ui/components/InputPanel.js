import { createElement, clearElement } from '../ui-helpers.js';

export function mountInputPanel(container, state) {
  clearElement(container);
  const form = createElement('form', { className: 'input-panel' });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const prompt = textarea.value.trim();
    if (prompt.length === 0) return;
    state.run(prompt);
  });

  const label = createElement('label', { text: 'Prompt', attrs: { for: 'promptInput' } });
  const textarea = createElement('textarea', {
    attrs: { id: 'promptInput', rows: '5', 'aria-label': 'Prompt' }
  });
  textarea.value = state.current.prompt;

  const submit = createElement('button', { text: 'Generate Space Field', attrs: { type: 'submit' } });

  form.append(label, textarea, submit);
  container.appendChild(form);
}
