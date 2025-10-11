// Simple pub/sub and session state
export const state = {
  selection: null,
  lastPrompt: '',
  map: null,
  answer: '',
  trace: '',
  listeners: new Map(),
};

export function on(evt, fn){
  if(!state.listeners.has(evt)) state.listeners.set(evt, new Set());
  state.listeners.get(evt).add(fn);
  return () => state.listeners.get(evt).delete(fn);
}
export function emit(evt, payload){ (state.listeners.get(evt)||[]).forEach(fn => fn(payload)); }

export function setSelection(sel){ state.selection = sel; emit('selection', sel); }
export function setResults({map, answer, trace}) {
  state.map = map; state.answer = answer; state.trace = trace;
  emit('results', {map, answer, trace});
}
