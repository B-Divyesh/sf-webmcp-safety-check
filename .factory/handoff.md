# WebMCP Safety Check — polish round 1 handoff

## Result: ready for deployment verification

This repair resolves F-1-1 through F-1-18 from `.factory/review-1.md`. It adds a dedicated, isolated `/demo/` destination (with `?demo=1` compatibility), an immediate populated review viewport and focus target, a standalone CLI `--demo`, plain-language copy, route metadata, sitemap coverage, 44 px legal targets, and corrected 404 wording.

## Local verification

- `npm ci`: passed, zero vulnerabilities reported.
- `npm test`: 15/15 passed, including `@claim:cli-demo` in a packed clean consumer.
- `npm run lint` and `npm run typecheck`: passed.
- `npm run build`: passed; `dist/site` contains the site, MV3 ZIP, standalone CLI, `/demo/`, and versioned service worker.
- `npm run test:e2e`: 44/44 passed on desktop and 390×844 mobile. This includes the one-click visible demo/focus regression, route metadata, mobile legal target, browser storage isolation, offline reload, privacy traffic, exports, 404, and axe checks.
- `npm run test:extension`: passed; extension smoke reports axe 0, console 0, external requests 0, storage 0.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo/ .factory/evidence/local-demo`: passed. It recorded title, `lang=en`, one h1, main landmark, complete image alt text, and zero console errors in 526 ms.
- Playwright axe scans in the browser suite have zero violations. The standalone `@axe-core/cli` attempted to use ChromeDriver 152 against the preinstalled Chromium 145 and could not start; the repository’s pinned Playwright 1.58.2 axe integration is the passing browser accessibility evidence.

Local screenshots: `.factory/evidence/local-demo/screenshot-desktop.png` and `.factory/evidence/local-demo/screenshot-mobile.png`.

## Reproduce

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run test:extension
```

For the CLI sample after building: `node dist/cli/webmcp-safety-check.mjs --demo`. It prints a new temporary directory containing the sample manifest and review; the intentional blocking sample exits 1.

## Remaining work

Deploy `dist/site`, then run the documented cold live-site confirmation for `/`, `/demo/`, `?demo=1`, legal routes, 404, offline demo, and both downloads. No product defect is known locally.
