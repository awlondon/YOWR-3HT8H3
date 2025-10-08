export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text) el.textContent = options.text;
  if (options.html) el.innerHTML = options.html;
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

export function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
