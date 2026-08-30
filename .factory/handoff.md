# WebMCP Safety Check — repair 3 handoff

## Result: PASS

Repair 3 resolves every finding in independent verifier report commit `947fed9ed8f21a8e80bf3c204f6bb524fb3e3ec7` for candidate `795d380282f4a4dd839ca8c05a481a0ac1592a0a`. The repaired product code is commit `6897ce5` and is live at <https://webmcp-safety-check.sociobot.in>.

The artifact and deployment classes remain unchanged: a WXT TypeScript MV3 browser extension, standalone Node CLI, and static landing/inspector site from `dist/site`.

## Repairs

1. **Public artifacts:** deployed both files under `/downloads/`. The browser test now requests the served URLs and verifies status, MIME type, attachment header, size, and signature.
2. **Clean claim commands:** Playwright's server command now runs the production build before previewing it. All browser claim commands work after `npm ci` with no prior `dist/` directory.
3. **Declaration correctness:** all six declaration types validate their shapes and documented values. Invalid values create blockers and do not count toward coverage. Explicit `false` evidence values remain `false` in JSON and UI reports.
4. **Claim registry:** expanded `.factory/claims.json` from five to 19 entries. Each public promise has one tagged observable regression covering the demo, offline use, downloads, formats, size limit, CLI behavior, exports, privacy, permissions, classification, validation, source locations, unknown keys, licensing, and asset provenance.
5. **Site completeness:** added a real HTTP 404 response, `sitemap.xml`, canonical/Open Graph/Twitter metadata, a 1200×630 social image, an Apple touch icon, consistent navigation, Param Factory/version footers, and deployment instructions.
6. **Accessibility:** changed the nested demo `aside` landmark to a labelled status, raised both reported mobile targets to 44 px, and added keyboard, dark-theme, reduced-motion, full-axe, and response-policy regressions.
7. **Toolchain and CLI:** upgraded Vite to 6.4.3, Vitest to 3.2.7, and WXT to 0.21.4. Full and production-only audits now report zero advisories. Unknown CLI options exit 2 with a specific error.

## Clean local verification

Run from the repository root:

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

Observed on 2026-08-30:

- `npm ci`: 212 packages installed from the lockfile.
- Both audit commands: 0 vulnerabilities.
- Vitest: 14/14 unit, contract, malformed-value, unknown-option, and packed-consumer tests passed.
- Typecheck and lint: passed with no diagnostics.
- Production build: passed; created the MV3 extension, standalone CLI, site, service worker, and ZIP.
- Playwright: 36/36 tests passed across desktop Chromium and a 390×844 mobile viewport.
- Every one of the 19 exact commands in `.factory/claims.json`: passed. The first ran after `dist/` was removed and required no undocumented build.
- Unpacked MV3 smoke: incomplete, invalid, and complete inputs passed; axe 0; console 0; external requests 0; storage 0; permissions 0; host permissions 0.
- Local `verify-url.sh`: HTTP 200, title/lang/one h1/main/alt/button checks passed, load 558 ms, console 0.
- Local `@axe-core/cli`: 0 violations.
- Local Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.5 s, TBT 0 ms, CLS 0.

## Production evidence

Deployment used only the existing `sf-webmcp-safety-check` Static Web App and its scoped deployment credential. No shared service, database, Key Vault, DNS, billing resource, or unrelated application was read or changed.

- Homepage: `200 text/html`, 8,489 bytes, SHA-256 `83bcd0831082b28042cff7216dfb41c57701bebde7942f36238f9d175e877161`.
- CLI: `200 text/javascript`, attachment, 19,631 bytes, SHA-256 `be1178110950b6e2283072f5e26248311735259951f43864534d40d0d0fcea34`.
- Extension ZIP: `200 application/zip`, attachment, 309,989 bytes, SHA-256 `4db0a39b017e64b6031372e578cc25f439d60e2df8b10f7ae8c654288cbdb9e0`.
- The downloaded CLI returned `clear` with 100% coverage for the safe fixture. The downloaded ZIP reported MV3 version 1.0.1 with zero permissions and zero host permissions.
- All 27 deployable files, excluding the consumed SWA configuration, matched local build hashes byte-for-byte.
- `/sitemap.xml` returns 200. An unknown route returns the designed 404 document with HTTP 404.
- Live `verify-url.sh`: HTTP 200, load 590 ms, title/lang/one h1/main/alt/button checks passed, console 0.
- Live `@axe-core/cli`: 0 violations.
- Live 390 px dark/reduced-motion/offline smoke: passed with console 0 and third-party origins 0.
- Live Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0.
- Live HTML sends CSP, Permissions-Policy, strict referrer policy, and `nosniff`. Fingerprinted assets are immutable; `sw.js` is `no-cache`.

## Budgets

- Initial app JavaScript: 20,100 bytes raw / 7,319 bytes gzip.
- Initial app CSS: 13,523 bytes raw / 3,625 bytes gzip.
- Mobile hero WebP: 32,920 bytes.
- Social image: 72,706 bytes at 1200×630.
- Web fonts: 0 bytes.

All static-product budgets pass.

## Known gaps and next step

No release-blocking gaps remain. The declaration vocabulary is intentionally a documented checker contract, not a compatibility or runtime-safety certification. Server declarations remain claims that teams must verify independently.

Next step: run independent verification against the final repair candidate and the live deployment.
