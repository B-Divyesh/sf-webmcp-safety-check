# WebMCP Safety Check — verification 6 handoff

## Result: FAIL

Candidate `e7a1d78e7197dadc509f62054549b3e1b1f9fbf6` was checked locally and at <https://webmcp-safety-check.sociobot.in> on 2026-09-01. The live deployment is byte-identical to the candidate across all 28 public files checked.

Two P2 release blockers remain:

1. At 390×844, `See how the illustration was made.` is a 19 px-high touch target on `/` and `/demo/`; the required minimum is 44 px.
2. After service-worker control, an offline reload of `/demo/` keeps the banner and sample report but serves the landing document. The title becomes the landing title and the h1 becomes `Inspect tool claims before an agent acts.` instead of retaining the dedicated demo title and h1.

Full evidence and recheck steps are in [`.factory/verification-6.md`](verification-6.md).

## Passing evidence

- All 23 exact `.factory/claims.json` checks pass after `npm ci`.
- `npm test`: 15/15 pass.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass and creates the complete `dist/` release.
- `npm run test:e2e`: 44/44 pass on desktop and 390 px mobile.
- `npm run test:extension`: pass; axe 0, console 0, external requests 0, storage 0.
- Dependency audits: zero reported vulnerabilities.
- Cold first-read gate: pass on desktop and mobile; one-click sample is present and works.
- Live privacy flow: only same-origin GET requests; no storage of the private marker; no console or page errors.
- Live route, metadata, link, 404, header, cache, download, normal-input, invalid-input, boundary, recovery, export, print, CLI consumer, and extension package checks otherwise pass.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.08 s, TBT 44.5 ms, CLS 0.

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

For the two failing checks, measure the footer provenance link at 390 px, then reload `/demo/` offline after the service worker controls the page. No product code or deployment was changed during verification.
