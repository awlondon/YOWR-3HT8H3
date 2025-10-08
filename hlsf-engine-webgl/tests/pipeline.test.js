import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPipeline } from '../src/core/steps.js';

test('runPipeline returns structured map and answer', async () => {
  const result = await runPipeline('Test prompt');
  assert.ok(result.map);
  assert.ok(Array.isArray(result.map.tokens));
  assert.ok(result.map.tokens.length > 0);
  assert.ok(typeof result.answer === 'string');
});
