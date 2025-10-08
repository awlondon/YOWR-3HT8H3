import { describe, it, expect } from 'vitest';
import { tokenizeInput } from '../src/core/tokenize.js';

describe('tokenizeInput', () => {
  it('produces token objects with weights', () => {
    const tokens = tokenizeInput('Learning linear algebra quickly with creative practice.');
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0]).toHaveProperty('id');
    expect(tokens[0]).toHaveProperty('weight');
  });
});
