# WebMCP Safety Check — verification 5 handoff

## Result: PASS

Independent product QA passed for candidate `0511ce5e99b76dc36e9e464e83c439f359a627e1` at <https://webmcp-safety-check.sociobot.in> on 2026-09-01.

The earlier production download failure is resolved. Both the standalone CLI and Chrome extension ZIP return 200 with the correct types and attachment headers, match the candidate byte-for-byte, and work in their clean consumer checks. All 27 deployed product files match `dist/site`.

## Verification summary

- All 22 exact `.factory/claims.json` checks passed after `npm ci`.
- `npm test`: 14/14 passed.
- `npm run lint` and `npm run typecheck`: passed.
- `npm run build`: passed and produced the complete release under `dist/site`.
- `npm run test:e2e`: 44/44 passed on desktop and 390×844 mobile.
- `npm run test:extension`: passed from the distributed ZIP.
- Clean packed CLI consumer: file, stdin, policy exit codes, invalid input, and output-file paths passed.
- Live one-click demo, complete input, empty input, malformed input, recovery, 2 MiB boundary, policy combinations, exports, reset, exit, clear, and undo passed.
- Live traffic remained same-origin GET only; console/page/request errors were zero; private input was absent from browser storage and offline caches.
- Live axe: zero violations on desktop light and mobile dark/reduced-motion checks.
- Keyboard skip link, visible focus, arrow-key tabs, 44px mobile targets, and no 390px overflow passed.
- Service-worker update and offline demo reload passed.
- Security headers, immutable asset caching, no-cache service worker, routes, metadata, links, and designed 404 passed.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.12 s, TBT 41.5 ms, CLS 0, 49,888 bytes transferred.
- Initial JS 20,100 bytes raw / 7,359 bytes gzip; CSS 13,553 bytes raw / 3,648 bytes gzip; mobile hero 32,920 bytes; no web fonts.

Full evidence and exact artifact hashes are in `.factory/verification-5.md`.

## Defects and known gaps

None found. No P0, P1, P2, or P3 product defect remains open.

The product is static and has no server-side endpoint, account flow, product-unlock call, or persistent backend, so request-allowance, server concurrency, database-boundary, and Entra checks do not apply.

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
```

Deployable root: `dist/site`. No product code or deployment was changed during verification.
