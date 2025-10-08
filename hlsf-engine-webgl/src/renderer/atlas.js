import glyphData from '../data/glyphs.json' assert { type: 'json' };
import { createTexture } from './gl-utils.js';

const CELL = 32;
const ATLAS_SIZE = 1024;

export function buildGlyphAtlas(gl, canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '24px "Atkinson Hyperlegible", sans-serif';

  const glyphMap = new Map();
  const alphabet = glyphData.alphabet;
  for (let i = 0; i < alphabet.length; i++) {
    const glyph = alphabet[i];
    const col = i % (ATLAS_SIZE / CELL);
    const row = Math.floor(i / (ATLAS_SIZE / CELL));
    const x = col * CELL + CELL / 2;
    const y = row * CELL + CELL / 2;
    ctx.fillText(glyph, x, y + 2);
    const u0 = col * CELL / ATLAS_SIZE;
    const v0 = row * CELL / ATLAS_SIZE;
    const u1 = (col + 1) * CELL / ATLAS_SIZE;
    const v1 = (row + 1) * CELL / ATLAS_SIZE;
    glyphMap.set(glyph, { u0, v0, u1, v1 });
  }

  const imageData = ctx.getImageData(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  const source = imageData.data;
  const alpha = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE);
  for (let i = 0, j = 0; i < source.length; i += 4, j += 1) {
    alpha[j] = source[i + 3];
  }

  const texture = createTexture(gl, ATLAS_SIZE, ATLAS_SIZE, alpha);
  return { texture, glyphMap, size: ATLAS_SIZE };
}
