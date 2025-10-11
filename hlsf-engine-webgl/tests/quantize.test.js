import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quantizeTokens } from '../src/core/quantize.js';

test('quantizeTokens normalizes weights and produces intensity', () => {
  const tokens = [
    { id: 'a', text: 'alpha', weight: 2 },
    { id: 'b', text: 'beta', weight: 4 }
  ];
  const quantized = quantizeTokens(tokens);
  assert.ok('intensity' in quantized[0]);
  assert.ok(quantized[1].intensity <= 1);
  assert.ok(quantized[1].radius > quantized[0].radius);
});
