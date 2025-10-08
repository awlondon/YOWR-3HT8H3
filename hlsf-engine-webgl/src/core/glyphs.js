import glyphs from '../data/glyphs.json' assert { type: 'json' };

export function mapGlyphs(tokens) {
  // Step 18: Load the canonical 1,000 symbol glyph set.
  const alphabet = glyphs.alphabet;
  // Step 19: Determine deterministic glyph assignment offset via checksum.
  const seed = tokens.reduce((acc, t) => acc + t.text.length, 0);
  // Step 20: Assign glyphs to tokens based on index and checksum.
  return tokens.map((token, index) => {
    const glyph = alphabet[(seed + index) % alphabet.length];
    return { ...token, glyph };
  });
}
