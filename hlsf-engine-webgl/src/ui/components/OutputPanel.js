import { on } from '../../state.js';

export function OutputPanel(){
  const el = document.createElement('section');
  el.className = 'panel output-panel';
  el.innerHTML = `
    <h2>Output</h2>
    <article id="answer"></article>
    <h3>Summary</h3>
    <article id="summary"></article>
  `;
  const ans = el.querySelector('#answer');
  const sum = el.querySelector('#summary');

  on('results', ({answer, trace}) => {
    ans.textContent = answer || '(no answer)';
    sum.textContent = trace || '(no summary)';
  });

  return { el, render(a,t){ ans.textContent=a; sum.textContent=t; } };
}
