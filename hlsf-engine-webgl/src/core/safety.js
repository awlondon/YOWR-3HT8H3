export function runSafetyChecks(tokens, expansions) {
  // Step 93: Detect potentially harmful tokens using heuristic rules.
  const flaggedTokens = tokens.filter((token) => /harm|weapon|abuse/.test(token.text));
  // Step 94: Detect expansions with extremely low value density indicating noise.
  const flaggedExpansions = expansions.filter((exp) => exp.v < 0.05);
  return { flaggedTokens, flaggedExpansions };
}
