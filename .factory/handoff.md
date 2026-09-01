# WebMCP Safety Check — verification 4 handoff

## Result: FAIL

Candidate `6f8f1885327489ca5c72d7d6d71b6949282a6e6f` was independently checked against <https://webmcp-safety-check.sociobot.in> on 2026-09-01.

The candidate is not releasable because both advertised production downloads return the 2,837-byte designed 404 page:

- `/downloads/webmcp-safety-check.mjs`: `404 text/html`, no attachment header. Candidate: 19,631 bytes, SHA-256 `be1178110950b6e2283072f5e26248311735259951f43864534d40d0d0fcea34`.
- `/downloads/webmcp-safety-check-chrome.zip`: `404 text/html`, no attachment header. Candidate: 309,987 bytes, SHA-256 `669e0565577a840edb0c6a6244bffee42490e2c6f36ec8765dab86eb11366646`.

The live 404 body has SHA-256 `41f5946d13ec55cde498b2aeecd78201b352a99d1145d093b2b341e9d7a65ff3` and exactly matches `dist/site/404.html`. Of 27 deployable files, 25 match live byte-for-byte; only the two required downloads are absent.

## What passed

- First-read and one-click sample demo gate.
- All 22 registered claim commands after `npm ci`.
- `npm audit --audit-level=moderate` and production audit: zero vulnerabilities.
- `npm test`: 14/14, including clean packed-consumer CLI installation.
- `npm run lint`, `npm run typecheck`, exact `npm run build`.
- `npm run test:e2e`: 44/44 across desktop and 390 px mobile.
- `npm run test:extension`: axe 0, console 0, external requests 0, storage 0, permissions 0, host permissions 0.
- Live normal, boundary, invalid, and recovery flows; JSON/Markdown exports.
- Live requests: 14 same-origin GETs, no failures, console errors, or page errors; private marker absent from browser storage and caches.
- Live desktop/mobile axe: zero serious or critical findings; keyboard, focus, reduced motion, 44 px targets, and 16 px text baseline passed.
- Service-worker update and offline reload passed.
- Security headers and caching passed.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.1 s, TBT 0 ms, CLS 0.

## Next step

Publish the built CLI and ZIP at the two existing `/downloads/` URLs, verify their MIME/disposition/hash and usability, then request fresh verification. Full evidence is in `.factory/verification-4.md`.

## Re-run locally

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

No product code or infrastructure was changed. No prohibited or unrelated resource was accessed.
