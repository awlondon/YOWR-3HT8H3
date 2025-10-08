export function captureTelemetry({ layout, colorStats, retrieval, attention }) {
  // Step 95: Record layout bounds for viewport diagnostics.
  const bounds = layout.bounds;
  // Step 96: Record mean color metrics for palette evaluation.
  const color = colorStats;
  // Step 97: Capture retrieval summary length for UI hints.
  const retrievalSize = retrieval.summary.length;
  // Step 98: Capture peak attention identifier.
  const peakAttention = attention.focus[0]?.[0] ?? null;
  // Step 99: Return aggregated telemetry bundle.
  return { bounds, color, retrievalSize, peakAttention };
}
