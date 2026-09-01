# WebMCP Safety Check — repair 5 handoff

## Result: repaired, deployed, and verified

Release code commit: `9fe03f5` on `main`. The repaired static release was deployed to <https://webmcp-safety-check.sociobot.in> on 2026-09-01.

Deployment was limited to the existing `sf-webmcp-safety-check` Static Web App. No DNS, database, Key Vault, app settings, billing, or unrelated resource was read or changed.

## Failure reproduced first

Before the repair, fresh direct requests to both advertised paths returned the same 2,837-byte designed 404 document:

| Path | Status / type | Content-Disposition | SHA-256 |
| --- | --- | --- | --- |
| `/downloads/webmcp-safety-check.mjs` | `404 text/html` | absent | `41f5946d13ec55cde498b2aeecd78201b352a99d1145d093b2b341e9d7a65ff3` |
| `/downloads/webmcp-safety-check-chrome.zip` | `404 text/html` | absent | `41f5946d13ec55cde498b2aeecd78201b352a99d1145d093b2b341e9d7a65ff3` |

The root cause was the release boundary: `npm run build:site`, the advertised static deployment entry point, built only the Vite pages and service worker. The CLI and Chrome ZIP were added only by the broader `npm run build` sequence. A site-only production rebuild therefore produced a valid site with no download artifacts.

## Repair

- Made `npm run build:site` a clean, self-contained release build. It now builds the MV3 extension and standalone CLI, creates the WXT ZIP, builds the static pages and service worker, and copies both downloads into `dist/site/downloads/`.
- Made `npm run build` use that same path so the two release entry points cannot diverge.
- Changed Playwright's production server setup to delete prior artifacts and run `npm run build:site`. The old implementation fails this setup because both download files are absent.
- Strengthened `@claim:download-artifacts` to compare served bytes and SHA-256 values with both the canonical CLI and source WXT ZIP.
- Kept the clean direct-download CLI consumer check.
- Changed the extension smoke test to extract and load the actual ZIP from `dist/site/downloads/`, instead of loading the unpacked build directory.
- Updated the README to document `build:site` as a complete deployment build.

## Live artifact evidence

| Path | Status / type | Disposition | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| `/downloads/webmcp-safety-check.mjs` | `200 text/javascript` | `attachment` | 19,631 | `be1178110950b6e2283072f5e26248311735259951f43864534d40d0d0fcea34` |
| `/downloads/webmcp-safety-check-chrome.zip` | `200 application/zip` | `attachment` | 309,987 | `669e0565577a840edb0c6a6244bffee42490e2c6f36ec8765dab86eb11366646` |

Both live files are byte-for-byte equal to `dist/site/downloads/`. The downloaded CLI returned a clear JSON report with zero blockers for the shipped safe manifest. `unzip -t` reported no errors. The downloaded extension manifest is MV3, has the expected product identity, and has empty `permissions` and `host_permissions` arrays. All 27 deployable files, including the designed 404 response, matched production byte-for-byte.

## Verification evidence

The checkout began without `node_modules`. `npm ci` installed 212 packages and reported zero vulnerabilities. The following passed after the repair:

```bash
npm audit --audit-level=moderate
npm audit --omit=dev --audit-level=high
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run test:extension
```

- `npm test`: 14/14 unit and integration tests passed, including packing and installing the CLI in a fresh temporary consumer.
- `npm run test:e2e`: 44/44 passed in one complete rerun across desktop Chromium and a 390×844 mobile viewport.
- Every command in `.factory/claims.json` was also run independently: all 22 claims passed.
- `npm run test:extension`: the distributed ZIP was extracted into a fresh temporary directory and loaded in Chromium; axe 0, console errors 0, external requests 0, browser storage 0, permissions 0, host permissions 0.
- Local response checks: both downloads returned 200 with the correct MIME type, attachment filename, exact hash, and valid consumer behavior.
- Live browser checks: desktop and dark/reduced-motion mobile axe violations 0; console/page errors 0; first keyboard focus was the skip link; focus entered main; no 390 px overflow or undersized visible controls.
- Live privacy checks: requests remained same-origin; a private input marker was absent from localStorage, sessionStorage, IndexedDB, and service-worker cache bodies.
- Live offline/update checks: the versioned cache `webmcp-safety-check-bfb46a5dbe724fca` controlled the page, `registration.update()` left no waiting worker, and the analyzed demo survived an offline reload.
- `/opt/fleet/lib/verify-url.sh` live: HTTP 200, 570 ms network-idle load, correct title/lang, one h1, main present, missing alt text 0, unlabeled buttons 0, console errors 0.
- Live Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 0 ms, CLS 0, 49 KiB transferred.
- Production budgets: initial JS 20,100 bytes raw / 7.32 KiB gzip; main CSS 13,553 bytes raw / 3.62 KiB gzip; mobile hero 32,920 bytes; no web fonts.

One first full Playwright run reached 43 passing tests before the supplied headless Chromium process segfaulted while opening a new mobile context. A complete rerun passed 44/44. Lighthouse likewise required the supplied Chrome path and `--disable-dev-shm-usage`; the final measured run passed all four categories at 100.

## Run and deploy

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run test:extension
```

The deployable root is `dist/site`. `npm run build:site` independently creates that complete release, including both download files.

## Known gaps

No product gaps remain from verification report commit `b17b282` or the controller's artifact review.
