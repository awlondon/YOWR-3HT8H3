// Renders a textarea + Run button and exposes getPrompt()
import { emit } from '../../state.js';

export function InputPanel(){
  const el = document.createElement('section');
  el.className = 'panel input-panel';

  const label = document.createElement('label');
  label.htmlFor = 'prompt';
  label.className = 'sr-only';
  label.textContent = 'Prompt';
  el.appendChild(label);

  const ta = document.createElement('textarea');
  ta.id = 'prompt';
  ta.rows = 10;
  ta.placeholder = 'Type a prompt and press Run or Ctrl/Cmd+Enter';
  el.appendChild(ta);

  const row = document.createElement('div');
  row.className = 'row';
  el.appendChild(row);

  const runBtn = document.createElement('button');
  runBtn.id = 'runBtn';
  runBtn.className = 'primary';
  runBtn.type = 'button';
  runBtn.textContent = 'Run';
  row.appendChild(runBtn);

  const tokCount = document.createElement('span');
  tokCount.id = 'tokCount';
  tokCount.setAttribute('aria-live', 'polite');
  row.appendChild(tokCount);

  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Options';
  details.appendChild(summary);

  const animateLabel = document.createElement('label');
  const animateCheckbox = document.createElement('input');
  animateCheckbox.type = 'checkbox';
  animateCheckbox.id = 'animateLayout';
  animateCheckbox.checked = true;
  animateLabel.appendChild(animateCheckbox);
  animateLabel.appendChild(document.createTextNode(' Animate layout'));

  const edgeLabel = document.createElement('label');
  const edgeCheckbox = document.createElement('input');
  edgeCheckbox.type = 'checkbox';
  edgeCheckbox.id = 'showEdges';
  edgeCheckbox.checked = true;
  edgeLabel.appendChild(edgeCheckbox);
  edgeLabel.appendChild(document.createTextNode(' Show edges'));

  details.appendChild(animateLabel);
  details.appendChild(edgeLabel);
  el.appendChild(details);

  function tokenCount(s){
    const str = s ?? '';
    return (str.match(/[\p{L}\p{N}\-']+/gu)||[]).length;
  }
  function updateCount(){ tokCount.textContent = `${tokenCount(ta.value)} tokens`; }
  ta.addEventListener('input', updateCount); updateCount();

  function run(){
    runBtn.disabled = true;
    runBtn.textContent = 'Running…';
    emit('run-request', {
      prompt: (ta.value ?? '').trim(),
      options: {
        animateLayout: animateCheckbox.checked,
        showEdges: edgeCheckbox.checked,
      }
    });
  }
  runBtn.addEventListener('click', run);
  ta.addEventListener('keydown', (e)=> {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
  });

  return {
    el,
    getPrompt: ()=> ta.value.trim(),
    focus: ()=> ta.focus()
  };
}
