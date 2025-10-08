export function formatOutput(reasoning, layout) {
  // Step 76: Create highlighted bullet list for UI output.
  const bullets = reasoning.split('\n').map((line) => `• ${line}`);
  // Step 77: Summarize region coverage statistics.
  const regionSummary = `${layout.regions.length} regions spanning ${layout.tokens.length} tokens`;
  // Step 78: Build inspector friendly map of token -> glyph.
  const glyphMap = layout.tokens.map((token) => `${token.glyph}:${token.text}`);
  // Step 79: Compose final formatted output structure.
  const formatted = {
    reasoning,
    bullets,
    regionSummary,
    glyphMap
  };
  // Step 80: Return formatted output for UI consumption.
  return formatted;
}
