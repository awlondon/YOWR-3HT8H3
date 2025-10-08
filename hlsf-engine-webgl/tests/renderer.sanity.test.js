import { describe, it, expect } from 'vitest';
import { NODES_VERT } from '../src/renderer/programs/nodes.vert.glsl.js';
import { NODES_FRAG } from '../src/renderer/programs/nodes.frag.glsl.js';
import { encodePickId } from '../src/renderer/buffers.js';

describe('renderer sanity', () => {
  it('contains WebGL2 shader headers', () => {
    expect(NODES_VERT).toContain('#version 300 es');
    expect(NODES_FRAG).toContain('#version 300 es');
  });

  it('encodes and decodes pick ids deterministically', () => {
    const [r, g, b] = encodePickId(257);
    expect(r).toBe(0x00);
    expect(g).toBe(0x01);
    expect(b).toBe(0x01);
  });
});
