import { on } from '../../state.js';

export function Inspector(){
  const el = document.createElement('section');
  el.className = 'panel inspector';
  el.innerHTML = `<h2>Inspector</h2><div id="body">(hover or click an item)</div>`;
  const body = el.querySelector('#body');

  on('selection', (sel)=>{
    if(!sel){ body.textContent = '(none selected)'; return; }
    const {type, data} = sel;
    body.innerHTML = `
      <p><b>Type:</b> ${type}</p>
      <p><b>ID:</b> ${data.id}</p>
      ${data.text? `<p><b>Text:</b> ${data.text}</p>`:''}
      ${data.v!=null? `<p><b>Vector:</b> ${data.v}</p>`:''}
      ${data.glyph? `<p><b>Glyph:</b> ${data.glyph}</p>`:''}
      ${data.alpha!=null? `<p><b>Alpha:</b> ${data.alpha}</p>`:''}
    `;
  });

  return { el };
}
