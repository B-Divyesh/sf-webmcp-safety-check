# WebMCP Safety Check — independent verification 3 handoff

## Result: FAIL

Candidate `8630d958c5400d3838e9a501ac112436b0225d2e` was independently tested against <https://webmcp-safety-check.sociobot.in> on 2026-08-30. It is **not releasable**.

The full evidence is in [`.factory/verification-3.md`](verification-3.md).

## Release blockers

1. Both live product downloads return the 2,837-byte HTML 404 page:
   - `/downloads/webmcp-safety-check.mjs` — expected the 19,631-byte CLI.
   - `/downloads/webmcp-safety-check-chrome.zip` — expected the 309,989-byte MV3 ZIP.
2. `.factory/claims.json` omits public testable promises including “Free,” “No install required,” and the README’s deployed 404/cache/security-header promises.
3. The light focus outline is `#d89928` against `#f4f0e3`, only 2.17:1 rather than the required 3:1.

Meaningful hero facts, status text, finding explanations, and footer copy also render at 12–14 px despite the required 16 px baseline and `.factory/design.md` claiming body copy is never smaller than 16 px.

## What passed

- First-read and one-click sample demo gate.
- All 19 exact `.factory/claims.json` commands.
- `npm ci`; both audit commands; 14/14 Vitest tests; lint; typecheck; exact production build; 36/36 Playwright tests; unpacked-extension smoke.
- Normal, boundary, invalid/recovery, export, classification, keyboard, mobile, dark, reduced-motion, privacy, offline-update/reload, and clean packed-consumer CLI checks.
- Axe: zero violations on live desktop and 390 px demo; console/page errors: zero.
- Lighthouse 12.8.2 mobile: 100/100/100/100; LCP 1.080 s, TBT 23 ms, CLS 0; 49,896 transferred bytes.
- All size budgets, security headers, immutable fingerprinted caching, real 404 routing, legal pages, and metadata checks.
- 25 of 27 public deployable files match the candidate byte-for-byte; only the two download artifacts are absent.

## Reproduce

```bash
npm ci
npm audit --audit-level=moderate
npm audit --omit=dev --audit-level=high
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run test:extension

curl -i https://webmcp-safety-check.sociobot.in/downloads/webmcp-safety-check.mjs
curl -i https://webmcp-safety-check.sociobot.in/downloads/webmcp-safety-check-chrome.zip
```

Both `curl` requests currently return `404`, `content-type: text/html`, no attachment header, and the candidate 404 body.

## Next step

Publish the two download artifacts, repair the claims registry and light focus contrast, raise undersized meaningful text, then independently re-verify the new commit and live URL.

Only the required factory reports were changed. No product code or deployment was modified. No unrelated service, database, Key Vault, infrastructure, DNS, or billing resource was read or changed.
