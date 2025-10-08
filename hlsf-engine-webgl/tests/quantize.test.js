import { describe, it, expect } from 'vitest';
import { quantizeTokens } from '../src/core/quantize.js';

describe('quantizeTokens', () => {
  it('normalizes weights and produces intensity', () => {
    const tokens = [
      { id: 'a', text: 'alpha', weight: 2 },
      { id: 'b', text: 'beta', weight: 4 }
    ];
    const quantized = quantizeTokens(tokens);
    expect(quantized[0]).toHaveProperty('intensity');
    expect(quantized[1].intensity).toBeLessThanOrEqual(1);
    expect(quantized[1].radius).toBeGreaterThan(quantized[0].radius);
  });
});
