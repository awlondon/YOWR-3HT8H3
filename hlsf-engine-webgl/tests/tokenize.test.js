import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeInput } from '../src/core/tokenize.js';

test('tokenizeInput produces token objects with weights', () => {
  const tokens = tokenizeInput('Learning linear algebra quickly with creative practice.');
  assert.ok(tokens.length > 0);
  assert.ok('id' in tokens[0]);
  assert.ok('weight' in tokens[0]);
});
