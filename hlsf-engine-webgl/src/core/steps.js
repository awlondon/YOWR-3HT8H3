import { tokenizeInput } from './tokenize.js';
import { quantizeTokens } from './quantize.js';
import { mapGlyphs } from './glyphs.js';
import { expandTokens } from './expand.js';
import { assignColors } from './color.js';
import { layoutNodes } from './layout.js';
import { deriveRegions } from './regions.js';
import { buildRetrieval } from './retrieval.js';
import { buildGraph } from './graph.js';
import { computeAttention } from './attention.js';
import { buildThreads } from './threads.js';
import { synthesizeReasoning } from './reasoning.js';
import { formatOutput } from './formatting.js';
import { exportMap } from './export.js';
import { runSafetyChecks } from './safety.js';
import { captureTelemetry } from './telemetry.js';

export function runPipeline(text) {
  const tokens = tokenizeInput(text);
  const quantized = quantizeTokens(tokens);
  const glyphMapped = mapGlyphs(quantized);
  const expansions = expandTokens(glyphMapped);
  const color = assignColors(glyphMapped, expansions);
  const layout = layoutNodes(color.tokens, color.expansions);
  const withRegions = deriveRegions(layout);
  const retrieval = buildRetrieval(withRegions);
  const graph = buildGraph(withRegions);
  const attention = computeAttention(graph);
  const threads = buildThreads(attention, withRegions.expansions);
  const reasoning = synthesizeReasoning(threads);
  const formatted = formatOutput(reasoning, withRegions);
  const safety = runSafetyChecks(withRegions.tokens, withRegions.expansions);
  const telemetry = captureTelemetry({ layout: withRegions, colorStats: color.colorStats, retrieval, attention });
  const exported = exportMap(withRegions, color);

  return {
    tokens: withRegions.tokens,
    expansions: withRegions.expansions,
    triangles: color.triangles,
    edges: withRegions.edges,
    regions: withRegions.regions,
    retrieval,
    graph,
    attention,
    threads,
    reasoning,
    formatted,
    safety,
    telemetry,
    exported
  };
}
