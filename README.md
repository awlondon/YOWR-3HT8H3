# High-Level Space Field Engine Monorepo

This repository hosts the browser-based High-Level Space Field (HLSF) cognition engine. The
project pairs a custom WebGL2 renderer with a fully client-side cognition pipeline to visualize
associative knowledge structures in real time.

## Repository Layout

| Path | Description |
| ---- | ----------- |
| `hlsf-engine-webgl/` | Vite application that implements the HLSF cognition engine and WebGL2 renderer. |
| `hlsf-engine-webgl/public/` | Static assets, including the bundled Atkinson Hyperlegible font and license. |
| `hlsf-engine-webgl/src/` | Application source split into cognition core modules, renderer utilities, UI widgets, and styles. |
| `hlsf-engine-webgl/tests/` | Vitest suites that cover tokenization, quantization, exporter integrity, and renderer buffer creation. |

Refer to [`hlsf-engine-webgl/README.md`](hlsf-engine-webgl/README.md) for a detailed breakdown of
engine features and rendering capabilities.

## Getting Started

1. Install Node.js 18 or newer.
2. Install dependencies from the application directory:
   ```bash
   cd hlsf-engine-webgl
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open the printed local URL (defaults to http://localhost:5173) to explore the cognition engine.

## Available Scripts

All project automation runs from the `hlsf-engine-webgl` directory:

- `npm run dev` – start the Vite development server.
- `npm run build` – build the production bundle.
- `npm run preview` – preview the production build locally.
- `npm test` – execute the Vitest unit test suites.

## Testing

Automated tests validate the cognition pipeline, exporter behavior, glyph atlas production, and
renderer buffer configuration. Run them locally with:

```bash
cd hlsf-engine-webgl
npm test
```

## License

The HLSF engine is distributed under the MIT License. See [`hlsf-engine-webgl/LICENSE`](hlsf-engine-webgl/LICENSE)
for full terms.
