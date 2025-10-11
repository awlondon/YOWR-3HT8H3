import { tokenizeInput } from './tokenize.js';
import { quantizeTokens } from './quantize.js';
import { mapGlyphs } from './glyphs.js';

function hueFor(index, total){
  if(!total) return 0.5;
  return (index / Math.max(1, total)) % 1;
}

export async function runPipeline(prompt = '', options = {}){
  const text = prompt.trim() || 'Explain the HLSF engine briefly.';
  const baseTokens = mapGlyphs(quantizeTokens(tokenizeInput(text)));
  const tokens = baseTokens.map((tok, idx)=>{
    const intensity = tok.intensity ?? (tok.weight ?? 1) * 0.1;
    const normalized = Math.min(1, intensity);
    const hue = hueFor(idx, baseTokens.length);
    const rgb = [0.3 + 0.4 * Math.sin(hue * Math.PI * 2), 0.4 + 0.3 * Math.cos(hue * Math.PI * 2), 0.6];
    const v = Math.round(normalized * 99.9);
    return {
      ...tok,
      v,
      radius: tok.radius ?? 24,
      rgb,
      alpha: 0.95,
      pos: [0, 0]
    };
  });

  const expansions = tokens.flatMap((tok, idx)=>{
    const baseVector = tok.v ?? 0;
    const semantic = {
      id: `exp-${tok.id}-a`,
      of: tok.id,
      type: 'semantic',
      text: `${tok.text} insight`,
      glyph: tok.glyph,
      v: (baseVector + 33) % 100,
      rgb: [0.55, 0.35, 0.75],
      alpha: 0.85,
      radius: tok.radius * 0.85,
      pos: [0, 0]
    };
    const associative = {
      id: `exp-${tok.id}-b`,
      of: tok.id,
      type: 'associative',
      text: tok.text.split('').reverse().join(''),
      glyph: tok.glyph,
      v: (baseVector + 66) % 100,
      rgb: [0.35, 0.65, 0.55],
      alpha: 0.8,
      radius: tok.radius * 0.75,
      pos: [0, 0]
    };
    return [semantic, associative];
  });

  const totalNodes = tokens.length + expansions.length || 1;
  tokens.forEach((tok, idx)=>{
    const angle = (idx / Math.max(1, tokens.length)) * Math.PI * 2;
    tok.pos = [Math.cos(angle) * 20, Math.sin(angle) * 20];
  });
  expansions.forEach((exp, idx)=>{
    const angle = (idx / totalNodes) * Math.PI * 4;
    const radius = 30 + (idx % 7) * 2;
    exp.pos = [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });

  const triangles = tokens.map((tok, idx)=>{
    const a = expansions[idx * 2];
    const b = expansions[idx * 2 + 1];
    if(!a || !b) return null;
    const baseHue = hueFor(idx, tokens.length);
    const rgb = [0.45 + 0.3 * Math.sin(baseHue * Math.PI * 2), 0.3 + 0.4 * Math.cos(baseHue * Math.PI * 2), 0.25 + 0.3 * baseHue];
    return {
      id: `tri-${tok.id}`,
      nodes: [tok.id, a.id, b.id],
      hsv: [baseHue * 360, 0.6, 0.8],
      alpha: 0.35,
      rgb,
    };
  }).filter(Boolean);

  const edges = [];
  for(let i=0;i<tokens.length - 1;i++){
    edges.push({ id: `edge-${i}`, a: tokens[i].id, b: tokens[i+1].id, rgb: [0.25, 0.5, 0.85, 0.25] });
  }

  const map = {
    tokens,
    expansions,
    triangles,
    edges,
    stats: { tokens: tokens.length, triangles: triangles.length, expansions: expansions.length },
    options,
  };

  const answer = `Prompt: "${text}"\nThis is a simulated response from the Space-Field engine.`;
  const trace = 'Stub pipeline executed locally (tokenize → quantize → glyphs).';
  return { map, answer, trace };
}
