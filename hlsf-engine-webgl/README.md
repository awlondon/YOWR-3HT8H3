# HLSF Engine WebGL

The High-Level Space Field (HLSF) cognition engine renders associative structures in real time
using a custom WebGL2 renderer. All computation runs fully in the browser with no frameworks or
remote dependencies. The renderer implements instanced nodes, glyphs built from a CPU-generated
atlas, CPU-extruded edges, and color-pick based inspection.

## Features

- 100-step cognition pipeline with traceable step identifiers.
- GPU accelerated visualization with WebGL2 instancing, high DPI support, and picking.
- Glyph atlas generated at runtime from a bundled open font; rendered glyphs cover the 1,000 symbol
  Space Field alphabet.
- Offline-first data persistence via IndexedDB with the `LOCAL_MODEL v.0.0.0.0` storage key.
- Import/export Space Field maps to JSON.
- CI powered by GitHub Actions running build and unit tests via Vitest.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 to interact with the engine. The default prompt demonstrates the
`"Find three creative study techniques for learning linear algebra quickly."` scenario.

### Scripts

- `npm run dev` – start Vite development server.
- `npm run build` – build production bundle.
- `npm run preview` – preview the production build.
- `npm test` – run Vitest unit tests.

## Testing

Tests cover tokenization, quantization, exporter integrity, and renderer buffer construction.
Additional renderer checks ensure GPU program source is generated as expected even when headless
WebGL2 is unavailable.

## Font Attribution

The bundled `AtkinsonHyperlegible-Regular.ttf` font is licensed under the Open Font License (OFL).
See `public/fonts/OFL-AtkinsonHyperlegible.txt` for the license text.

## License

This project is released under the MIT license. See [LICENSE](LICENSE).
