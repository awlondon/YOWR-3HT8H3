export function mountThemeToggle(button) {
  const apply = () => {
    document.body.classList.toggle('dark');
  };
  button.addEventListener('click', apply);
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      apply();
    }
  });
}
