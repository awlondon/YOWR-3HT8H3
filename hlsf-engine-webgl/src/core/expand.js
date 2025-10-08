import seeds from '../data/seed_associations.json' assert { type: 'json' };

export function expandTokens(tokens) {
  // Step 21: Build association lookup from seed data.
  const lookup = new Map(seeds.map((entry) => [entry.token, entry.associations]));
  // Step 22: For each token, generate associative expansions.
  const expansions = [];
  for (const token of tokens) {
    // Step 23: Fetch matching associations or fallback to syllabic permutations.
    const assoc = lookup.get(token.text) ?? permute(token.text);
    for (let idx = 0; idx < assoc.length; idx++) {
      // Step 24: Weight expansions using token intensity and association index.
      const weight = token.intensity * (1 - idx / assoc.length);
      // Step 25: Record expansion objects referencing parent tokens.
      expansions.push({
        id: `${token.id}-exp-${idx}`,
        of: token.id,
        type: lookup.has(token.text) ? 'semantic' : 'associative',
        text: assoc[idx],
        v: weight,
        glyph: assoc[idx].slice(0, 1) || token.glyph
      });
    }
  }
  // Step 26: Return expansions sorted by value density.
  return expansions.sort((a, b) => b.v - a.v);
}

function permute(text) {
  // Step 27: Generate fallback permutations by rotating characters.
  const permutations = new Set();
  for (let i = 0; i < Math.min(text.length, 3); i++) {
    const rotated = text.slice(i) + text.slice(0, i);
    permutations.add(rotated);
  }
  // Step 28: Add reversed pattern to enrich associative texture.
  permutations.add(text.split('').reverse().join(''));
  // Step 29: Ensure at least one variant exists for glyph assignment.
  if (permutations.size === 0) {
    permutations.add(text);
  }
  // Step 30: Emit permutation list for expansion use.
  return [...permutations];
}
