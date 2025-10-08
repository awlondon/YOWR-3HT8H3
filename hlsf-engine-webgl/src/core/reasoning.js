export function synthesizeReasoning(threads) {
  // Step 71: Extract representative statements from each thread.
  const statements = threads.map((thread) => {
    const top = thread.entries[0];
    return top ? `${thread.seed}:${top.text}` : `${thread.seed}:no-entry`;
  });
  // Step 72: Merge statements into reasoning clauses.
  const clauses = statements.map((stmt, index) => `Clause ${index + 1}: ${stmt}`);
  // Step 73: Score clauses based on thread depth.
  const scored = clauses.map((clause, index) => ({
    clause,
    score: threads[index]?.entries.length ?? 0
  }));
  // Step 74: Sort clauses by score descending.
  scored.sort((a, b) => b.score - a.score);
  // Step 75: Return reasoning narrative.
  return scored.map((item) => item.clause).join('\n');
}
