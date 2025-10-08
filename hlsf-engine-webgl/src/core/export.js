export function exportMap(layout, color) {
  // Step 81: Merge layout and color information into serializable nodes.
  const tokens = layout.tokens.map((token) => ({
    id: token.id,
    text: token.text,
    glyph: token.glyph,
    pos: token.pos,
    radius: token.radius,
    color: color.tokens.find((t) => t.id === token.id)?.rgb ?? [0.5, 0.5, 0.5]
  }));
  // Step 82: Collect expansions with positions and colors.
  const expansions = layout.expansions.map((exp) => ({
    id: exp.id,
    of: exp.of,
    text: exp.text,
    glyph: exp.glyph,
    pos: exp.pos,
    color: color.expansions.find((e) => e.id === exp.id)?.rgb ?? [0.4, 0.4, 0.4]
  }));
  // Step 83: Compose triangle descriptors.
  const triangles = color.triangles.map((tri) => ({
    id: tri.id,
    nodes: tri.nodes,
    hsv: tri.hsv,
    rgb: tri.rgb,
    alpha: tri.alpha
  }));
  // Step 84: Package edge metadata for persistence.
  const edges = layout.edges.map((edge) => ({ a: edge.a, b: edge.b, k: edge.k }));
  // Step 85: Return export payload.
  return { tokens, expansions, triangles, edges };
}

export function bundle(spaceField, retrieval = null, graph = null, metadata = {}, answer = '', prompt = '') {
  return {
    version: '0.0.1',
    exported_at: new Date().toISOString(),
    prompt,
    answer,
    trace_summary: metadata.summary ?? '',
    space_field: spaceField,
    retrieval,
    graph
  };
}

export function downloadJSON(payload, filename = 'hlsf-export.json') {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function pickAndLoadJSON() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    }, { once: true });
    input.click();
  });
}

export function importMap(payload) {
  // Step 86: Validate imported payload structure.
  if (!payload || !Array.isArray(payload.tokens)) {
    throw new Error('Invalid map payload');
  }
  // Step 87: Restore tokens with defaults for missing fields.
  const tokens = payload.tokens.map((token) => ({
    ...token,
    pos: token.pos ?? [0, 0]
  }));
  // Step 88: Restore expansions and triangles.
  const expansions = payload.expansions ?? [];
  const triangles = payload.triangles ?? [];
  const edges = payload.edges ?? [];
  // Step 89: Return sanitized payload.
  return { tokens, expansions, triangles, edges };
}
