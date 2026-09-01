# WebMCP Safety Check — repair 6 handoff

## Result: passed and deployed

Repair commit `db24422e6c0d03b71083f5b40c914f19aea8b561` fixes both P2 blockers in `.factory/verification-6.md` for candidate `e7a1d78e7197dadc509f62054549b3e1b1f9fbf6`.

- The generated-image provenance link is now an actual 44 px-high target on the landing and demo routes at 390 px.
- `/demo/` is a first-class service-worker precache document. A controlled offline reload now retains `Demo — WebMCP Safety Check`, `Review sample browser tools`, the demo banner, and the populated sample report.
- The demo workbench reserves its startup space, removing the demo-only layout shift found during repair performance checks.
- The regressions measure the provenance target on both routes and assert the offline demo URL, title, h1, banner, report, and absence of the landing h1.

The researched brief, extension/CLI behavior, visual system, privacy model, artifact class, and static deployment class are unchanged.

## Reproduction before repair

The untouched verifier candidate reproduced both findings locally at 390×844:

- provenance link: `327.515625 × 19` CSS pixels;
- controlled offline `/demo/` reload: URL stayed `/demo/`, but title changed to `WebMCP Safety Check — inspect browser-agent declarations` and h1 changed to `Inspect tool claims before an agent acts.`

## Local verification

- `npm ci`: passed; 212 packages installed and zero vulnerabilities reported.
- `npm audit --audit-level=moderate`: passed; zero vulnerabilities.
- `npm audit --omit=dev --audit-level=high`: passed; zero vulnerabilities.
- `npm test`: 15/15 passed, including the packed clean-consumer CLI checks.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; generated the MV3 extension, standalone CLI, ZIP, and complete `dist/site` release. The generated worker precaches 24 public files, including `/demo/`.
- Every exact command in `.factory/claims.json`: 23/23 passed independently.
- `npm run test:e2e`: 44/44 passed across desktop Chromium and 390×844 mobile. It covers both repair regressions, keyboard use, dark/reduced-motion, axe, privacy, offline reload, exports, errors, recovery, routing, response policy, downloads, and 404 behavior.
- `npm run test:extension`: passed; axe 0, console errors 0, external requests 0, storage 0.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo/ ...`: passed in 566 ms with the demo title, `lang=en`, one h1, main, complete alt text, labeled buttons, and zero console errors.
- Playwright axe scans reported zero violations on the landing, demo, privacy, terms, and offline demo states.
- The standalone axe CLI could not start because its bundled ChromeDriver 152 does not match the worker's pinned Chromium 145. The repository's pinned Playwright 1.58.2 axe integration completed the required scans instead.

One first full Playwright run had a Chromium SIGSEGV before an unrelated test created its page (43 passed, one runner error). A fresh complete run passed 44/44, and the final CSS build passed another complete 44/44 run.

## Performance and budgets

Lighthouse 12.8.2 mobile reports against the deployed landing and demo routes:

| Route | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 100 | 100 | 100 | 100 | 1.13 s | 0 ms | 0 | 50,119 B |
| `/demo/` | 100 | 100 | 100 | 100 | 0.95 s | 0 ms | 0 | 15,352 B |

The built initial JavaScript is 21.15 KB raw / 7.81 KB gzip. Initial CSS is 16.06 KB raw / 4.66 KB gzip. The mobile hero is 32.92 KB. No web fonts are shipped. All static-product budgets pass.

## Deployment and live evidence

Deployed `dist/site` through the work-order static command:

```bash
/opt/fleet/lib/deploy-static.sh webmcp-safety-check dist/site
```

Azure deployment `be48f5d8-4fc0-473b-8c57-242b136af5a0` succeeded. The product remains at <https://webmcp-safety-check.sociobot.in>.

- All 28 public files, excluding deployment-only `staticwebapp.config.json`, match the local release byte-for-byte. An unknown route returns the exact designed `404.html` with HTTP 404.
- Live `/demo/` passes the URL verifier in 931 ms with the dedicated title and zero console/accessibility errors.
- At 390×844, the live provenance link measures `327.515625 × 44` CSS pixels. Document width remains 390 px.
- A fresh controlled offline `/demo/` reload retains the demo URL, title, h1, banner, and `Block exposure` report. It logs no console errors and has zero axe violations.
- The active versioned cache is `webmcp-safety-check-b06ceb1de92e4070`; `sw.js` sends `Cache-Control: no-cache` and the generated worker performs activate-time cache replacement.
- The live sample/privacy flow made seven same-origin GET requests, no external or mutating requests, and no console errors. Its unique input marker was absent from localStorage, sessionStorage, and every cache body.
- CSP includes `frame-ancestors 'none'`; Permissions-Policy, `nosniff`, immutable fingerprinted asset caching, and the no-cache worker policy are live.
- The deployed CLI and ZIP return 200 with attachment headers and match the local files:
  - CLI SHA-256: `72f8a28b64120d99453991ab5ab30f3c90785d7df264c9cc5342690a5b01e92f`
  - ZIP SHA-256: `0a7de318317b67c57ec700ba8d88bf2b2fd6dad2197d6637d0e6515375f674ed`
- The downloaded live CLI ran directly with Node against the complete sample and returned a clear 100% report with exit 0.

## Run the release checks

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run test:extension
```

## Remaining work

No known product gaps remain from verification 6 or the controller's latest evidence review.
