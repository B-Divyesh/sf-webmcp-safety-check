# WebMCP Safety Check — polish round 1 handoff

## Result: passed and deployed

This repair resolves F-1-1 through F-1-18 from `.factory/review-1.md`. Product repair commit: `1d8590135be236c3d4958f57262ecae7624f32b5`. It adds a dedicated, isolated `/demo/` destination (with `?demo=1` compatibility), an immediate populated review viewport and focus target, a standalone CLI `--demo`, plain-language copy, route metadata, sitemap coverage, 44 px legal targets, and corrected 404 wording.

## Local verification

- `npm ci`: passed, zero vulnerabilities reported.
- `npm test`: 15/15 passed, including `@claim:cli-demo` in a packed clean consumer.
- `npm run lint` and `npm run typecheck`: passed.
- `npm run build`: passed; `dist/site` contains the site, MV3 ZIP, standalone CLI, `/demo/`, and versioned service worker.
- `npm run test:e2e`: 44/44 passed on desktop and 390×844 mobile. This includes the one-click visible demo/focus regression, route metadata, mobile legal target, browser storage isolation, offline reload, privacy traffic, exports, 404, and axe checks.
- Fresh clone: `git clone /work/repo /tmp/webmcp-clean-round1 && npm ci`, then all 23 exact commands from `.factory/claims.json`, passed independently. Final clean-clone Playwright status: passed, zero failed tests.
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

## Deployment and live confirmation

Deployed `dist/site` through the work-order static configuration. Azure deployment `d9e55376-31b5-4468-ab16-04469031787a` completed successfully; the custom domain returns HTTPS 200.

- Cold desktop 1440×900 and mobile 390×844 visits to `/` followed by **Try it with sample data** reached `/demo/`, focused the demo h1, and kept the banner and **Block exposure** report in viewport. The recorded live report positions are desktop y=407/585 and mobile y=351/640. See `.factory/evidence/live-demo/cold-check.json` and the two `after-click-*.png` screenshots.
- Live `/demo/` passes the URL verifier: 817 ms network-idle load, `Demo — WebMCP Safety Check`, `lang=en`, one h1, main, zero missing alt text, zero console errors. Screenshots and JSON are in `.factory/evidence/live-demo/`.
- Live `/?demo=1` redirects to `/demo/` with the demo title; `/privacy/` and `/terms/` return 200 with route titles; `/missing-page` returns 404 with “We could not find this page.”
- The live mobile legal wordmark and issue-tracker targets measure 44×44 and 192.7×44 CSS pixels. Live Playwright axe on mobile dark/reduced-motion reports zero violations.
- Live offline demo reload is service-worker controlled, retains **Block exposure**, and reports zero console errors.
- Live downloads return 200, attachment disposition, `text/javascript`/`application/zip`, and byte-identical SHA-256 hashes to `dist/site`: CLI `72f8a28b64120d99453991ab5ab30f3c90785d7df264c9cc5342690a5b01e92f`; ZIP `0a7de318317b67c57ec700ba8d88bf2b2fd6dad2197d6637d0e6515375f674ed`.

## Remaining work

None known.
