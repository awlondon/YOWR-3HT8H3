import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportMap, importMap } from '../src/core/export.js';

test('export/import map round trip', () => {
  const layout = {
    tokens: [{ id: 'a', text: 'alpha', glyph: 'A', pos: [1, 2], radius: 24 }],
    expansions: [{ id: 'a-exp-0', of: 'a', text: 'al', glyph: 'a', pos: [2, 3] }],
    edges: [{ a: 'a', b: 'a-exp-0', k: 0.5 }]
  };
  const color = {
    tokens: [{ id: 'a', rgb: [0.1, 0.2, 0.3] }],
    expansions: [{ id: 'a-exp-0', rgb: [0.2, 0.3, 0.4] }],
    triangles: [{ id: 'tri-0', nodes: ['a', 'a', 'a'], hsv: [0, 1, 1], rgb: [1, 0, 0], alpha: 0.3 }]
  };
  const exported = exportMap(layout, color);
  const imported = importMap(exported);
  assert.equal(imported.tokens[0].id, 'a');
  assert.equal(imported.expansions[0].id, 'a-exp-0');
  assert.equal(imported.triangles.length, 1);
});
