import { setSelection, on, state } from '../../state.js';
import { Renderer } from '../../renderer/renderer.js';
import { buildInstanceBuffers } from '../../renderer/buffers.js';

export function SpaceFieldGL(canvas){
  const gl = canvas.getContext('webgl2', {antialias:true, alpha:true});
  if(!gl) throw new Error('WebGL2 not available');
  const r = new Renderer(gl);
  let map = null;
  let bundle = null;
  let selectionId = null;

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w; canvas.height = h;
    }
    r.resize(w, h, dpr);
    if(bundle) r.draw(bundle);
  }
  window.addEventListener('resize', resize);
  resize();

  function render(newMap){
    map = newMap || map;
    if(!map) return;
    bundle = buildInstanceBuffers(gl, map, { selectionId, glyphAtlas: r.getGlyphAtlas?.() });
    r.draw(bundle);
  }

  // Hover picking tooltip
  canvas.addEventListener('mousemove', (e)=>{
    if(!map) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    const hit = r.pick(x, y, bundle);
    if(hit){
      canvas.title = hit.data?.text ? `${hit.data.text}` : hit.data?.id || '';
    } else {
      canvas.title = '';
    }
  });

  canvas.addEventListener('click', (e)=>{
    if(!map) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    const hit = r.pick(x, y, bundle);
    if(hit){
      selectionId = hit.data?.id ?? null;
      setSelection(hit);
      render();
    }
  });

  let isPanning = false;
  let lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e)=>{
    if(e.button !== 0) return;
    isPanning = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e)=>{
    if(!isPanning) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    r.pan(dx, dy);
    if(bundle) r.draw(bundle);
  });
  const endPan = (e)=>{
    if(isPanning){
      isPanning = false;
      if(canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    }
  };
  canvas.addEventListener('pointerup', endPan);
  canvas.addEventListener('pointercancel', endPan);
  canvas.addEventListener('wheel', (e)=>{
    if(!bundle) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    r.zoom(-e.deltaY, x, y);
    r.draw(bundle);
  }, {passive:false});

  on('results', ({map: newMap}) => {
    selectionId = state.selection?.data?.id ?? null;
    render(newMap);
  });

  on('selection', (sel)=>{
    selectionId = sel?.data?.id ?? null;
    if(map) render();
  });

  return { render };
}
