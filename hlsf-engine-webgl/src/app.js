import { InputPanel } from './ui/components/InputPanel.js';
import { OutputPanel } from './ui/components/OutputPanel.js';
import { Inspector } from './ui/components/Inspector.js';
import { SpaceFieldGL } from './ui/components/SpaceFieldGL.js';
import { setResults, on, state } from './state.js';
import { runPipeline } from './core/steps.js';
import * as Export from './core/export.js';
import * as Memory from './core/memory.js';

const left = document.getElementById('leftPane');
const right = document.getElementById('rightPane');
const glCanvas = document.getElementById('glCanvas');

const input = InputPanel();
left?.appendChild(input.el);
const output = OutputPanel();
right?.appendChild(output.el);
const inspector = Inspector();
right?.appendChild(inspector.el);
const viz = SpaceFieldGL(glCanvas);

async function handleRun(prompt, options){
  const safePrompt = prompt || 'Explain the HLSF engine briefly.';
  state.lastPrompt = safePrompt;
  const btn = document.querySelector('#runBtn');
  if(btn && !btn.disabled){ btn.disabled = true; btn.textContent = 'Running…'; }
  try {
    const res = await runPipeline(safePrompt, options);
    setResults(res);
    await Memory.persist({ map: res.map, answer: res.answer, trace: res.trace, prompt: safePrompt, savedAt: Date.now(), version: '0.0.0.0' });
  } catch (err){
    console.error(err);
    setResults({ map:null, answer:'There was an error running the engine.', trace:String(err) });
  } finally {
    const button = document.querySelector('#runBtn');
    if(button){ button.disabled = false; button.textContent = 'Run'; }
  }
}

on('run-request', ({prompt, options})=>{
  handleRun(prompt, options);
});

on('results', ({map})=>{
  state.map = map;
});

async function hydrate(){
  try {
    const saved = await Memory.loadLatest();
    if(saved?.map){
      state.lastPrompt = saved.prompt ?? state.lastPrompt;
      setResults({ map: saved.map, answer: saved.answer ?? '(loaded model)', trace: saved.trace ?? '(no summary)' });
    }
  } catch (err){
    console.warn('Failed to load saved model', err);
  } finally {
    if(!state.map){
      handleRun(state.lastPrompt, {});
    }
  }
}

hydrate();

document.getElementById('exportJsonBtn')?.addEventListener('click', ()=>{
  if(!state.map) return;
  const pkg = Export.bundle(state.map, null, null, { summary: state.trace }, state.answer, state.lastPrompt);
  Export.downloadJSON(pkg, `hlsf-map-${Date.now()}.json`);
});

document.getElementById('importJsonBtn')?.addEventListener('click', async ()=>{
  try {
    const pkg = await Export.pickAndLoadJSON();
    if(pkg?.space_field){
      setResults({ map: pkg.space_field, answer: pkg.answer ?? '(loaded from file)', trace: pkg.trace_summary ?? '' });
    }
  } catch (err){
    console.error('Failed to import JSON', err);
  }
});

document.getElementById('saveModelBtn')?.addEventListener('click', ()=>{
  if(!state.map) return;
  Memory.persist({ map: state.map, answer: state.answer, trace: state.trace, prompt: state.lastPrompt, savedAt: Date.now(), version: '0.0.0.0' });
});

document.getElementById('loadModelBtn')?.addEventListener('click', async ()=>{
  const saved = await Memory.loadLatest();
  if(saved?.map){
    setResults({ map: saved.map, answer: saved.answer ?? '(loaded model)', trace: saved.trace ?? '(no summary)' });
  }
});

export { viz, input, output, inspector };
