import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NODES_VERT } from '../src/renderer/programs/nodes.vert.glsl.js';
import { NODES_FRAG } from '../src/renderer/programs/nodes.frag.glsl.js';
import { buildInstanceBuffers } from '../src/renderer/buffers.js';

test('node shaders include WebGL2 headers', () => {
  assert.ok(NODES_VERT.includes('#version 300 es'));
  assert.ok(NODES_FRAG.includes('#version 300 es'));
});

test('buildInstanceBuffers provides pick decoding', () => {
  const map = { tokens: [{ id: 'tok-0', text: 'alpha', glyph: 'A', pos: [0, 0], radius: 20, rgb: [0.3, 0.4, 0.5] }], expansions: [], triangles: [], edges: [] };
  const bundle = buildInstanceBuffers(undefined, map, {});
  const sel = bundle.pick.decode(0, 0, 1);
  assert.ok(sel);
  assert.equal(sel.type, 'token');
  assert.equal(sel.data.id, 'tok-0');
});
