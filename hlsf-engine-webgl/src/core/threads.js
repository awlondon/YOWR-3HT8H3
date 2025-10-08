export function buildThreads(attention, expansions) {
  // Step 66: Seed conversation threads from top attention nodes.
  const seeds = attention.focus.slice(0, 4).map(([id]) => id);
  // Step 67: Create thread skeletons for each seed.
  const threads = seeds.map((seedId, index) => ({
    id: `thr-${index}`,
    seed: seedId,
    entries: []
  }));
  // Step 68: Populate threads with matching expansions.
  for (const expansion of expansions) {
    const thread = threads.find((thr) => thr.seed === expansion.of);
    if (thread) {
      thread.entries.push({ id: expansion.id, text: expansion.text, value: expansion.v });
    }
  }
  // Step 69: Sort each thread chronologically by value decay.
  for (const thread of threads) {
    thread.entries.sort((a, b) => b.value - a.value);
  }
  // Step 70: Return structured thread set.
  return threads;
}
