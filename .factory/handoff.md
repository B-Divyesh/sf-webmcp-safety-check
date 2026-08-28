# WebMCP Safety Check — build handoff

Work order: `webmcp-safety-check-build-1`  
Completed: 2026-08-28

## What shipped

- A WXT + TypeScript Manifest V3 extension with zero permissions and zero host access. Its popup accepts local JSON/JSONL files, drag-and-drop, or pasted input; analysis and exports work offline.
- A shared safety engine that extracts tools from manifests, single tool documents, JSON-RPC `tools/list` transcripts, transcript arrays, and JSONL. It inventories effect, approval, evidence, profile, origins, and credential claims.
- Findings for missing declarations plus combination checks: external navigation without origin scope and real-profile use without credential scope are blockers. Description keywords are explicitly labeled as hints and never substitute for declarations.
- Exportable JSON reports, Markdown review cards, printable cards, clear/error/loading/offline/empty states, five-second undo for clearing input, keyboard-operated tabs, and a 2 MB browser-side input guard.
- A standalone Node 20+ CLI with Markdown/JSON output, stdin support, output files, custom policy files, `--strict`, and stable CI exits (`0` pass, `1` policy findings, `2` input/config error).
- A responsive static landing site with the complete local inspector, extension/CLI downloads, specification boundary, example format, privacy page, terms page, and versioned offline service worker.
- A product-specific botanical field-guide system and original generated hero illustration. Source prompt/provenance is in `.factory/design.md` and `assets/src/`; shipped WebP variants are 33 KB and 140 KB.
- Documentation, MIT license, JSON policy schema, complete/incomplete example manifests, unit tests, Playwright interaction tests, and axe checks.

## Build and verification

Exact clean build:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Verified in this work order:

- `npm test`: 6/6 unit tests passed.
- `npm run typecheck`: passed with strict TypeScript.
- `npm run build`: passed; deployment entry is `dist/site/index.html`.
- `npm run test:e2e`: 6/6 passed across desktop Chromium and a 390 × 844 mobile viewport. This covers parsing, missing required declarations, safe manifests, keyboard tab navigation, legal pages, console errors, and axe scans; no serious/critical axe findings.
- CLI smoke test: incomplete example exited `1` with five blockers; complete example exited `0` with 100% declaration coverage.
- Production Lighthouse mobile run: Performance 100, Accessibility 100, Best Practices 100, SEO 100. LCP 1.39 s, FCP 0.99 s, CLS 0, Total Blocking Time 0 ms. Lab INP was unavailable because the run had no recorded user interaction; tested interactions complete synchronously and the 0 ms TBT is the lab responsiveness proxy.
- Production site payload: 18.36 KB initial application JavaScript (6.72 KB gzip), 12.82 KB largest page CSS (3.53 KB gzip), 33 KB mobile hero, no fonts. These are below the 200 KB JS, 50 KB CSS, 120 KB font, and 300 KB hero budgets.
- `npm audit --omit=dev`: zero production vulnerabilities.
- Visual review completed at desktop and 390 px. The generated hero contains no text artifacts, brands, people, or misleading UI.

Artifacts:

- Static deploy: `dist/site/`
- Chrome MV3 zip: `dist/site/downloads/webmcp-safety-check-chrome.zip`
- Standalone CLI: `dist/site/downloads/webmcp-safety-check.mjs`
- Unpacked extension: `.output/chrome-mv3/` after build

## Known gaps and next steps

- The policy field names are an honest checker contract, not an asserted WebMCP standard. Reconcile aliases and semantics as MCP/WebMCP safety-contract proposals stabilize, then version the report schema.
- Declarations remain self-reported claims. Runtime observation, vendor certification, task execution, and browser-content inspection are intentionally out of scope.
- The downloadable extension is an unsigned Chrome-compatible development zip. Store signing and deployment are factory responsibilities; Firefox packaging has not been claimed or tested.
- No live INP field data exists for a new, analytics-free product. Keep the current interaction tests and re-measure with privacy-preserving aggregate field data only if the factory later adopts it.
