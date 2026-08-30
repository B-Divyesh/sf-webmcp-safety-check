# WebMCP Safety Check — repair 4 handoff

## Result: deployed and verified

Repair commits: `49f515e` and `948840b` on `main`.

The static product was deployed to <https://webmcp-safety-check.sociobot.in> on 2026-08-30. The deployment targeted only `sf-webmcp-safety-check`; no database, Key Vault, unrelated app, DNS, or billing resource was read or changed.

## Reproduced release failure

Before the repair, both live public download URLs returned the same 2,837-byte designed 404 document (`SHA-256 e2da75eca9f247a111fd5dfd6637eea3f2641ff621a15726c57a9d4870d203e6`):

- `/downloads/webmcp-safety-check.mjs`
- `/downloads/webmcp-safety-check-chrome.zip`

## Repairs

- Published the built standalone CLI and Chrome MV3 ZIP at those exact paths. The download claim now compares the served bytes to the built CLI/WXT ZIP; a separate test downloads the CLI to a fresh temporary directory and runs it directly with Node.
- Added registered, tagged claims for the standalone no-install CLI, free/no-account/no-payment product access, and the README static deployment contract. The registry now has 22 claims, each with exactly one matching `@claim:` test tag.
- Replaced the light focus token with `#704300`. Its contrast is 7.39:1 on paper, 6.58:1 on deep paper, and 8.28:1 on sheet; terminal controls use bright ochre at 11.28:1. The browser regression test verifies every light surface and the terminal.
- Raised meaningful landing, inspector, legal, and extension copy to the 16 px baseline, including mobile overrides. Added computed-style coverage for the formerly undersized texts at desktop and 390 px mobile.
- Updated the visual thesis and landing-copy audit for the revised focus and typography contracts.

## Live artifact evidence

| Path | Status / type | Size | SHA-256 |
| --- | --- | ---: | --- |
| `/downloads/webmcp-safety-check.mjs` | `200`, `text/javascript`, `Content-Disposition: attachment` | 19,631 bytes | `be1178110950b6e2283072f5e26248311735259951f43864534d40d0d0fcea34` |
| `/downloads/webmcp-safety-check-chrome.zip` | `200`, `application/zip`, `Content-Disposition: attachment` | 309,987 bytes | `669e0565577a840edb0c6a6244bffee42490e2c6f36ec8765dab86eb11366646` |

Both live hashes match `dist/site/downloads/`. The downloaded CLI returned a clear JSON review for the shipped safe fixture. The downloaded ZIP contains an MV3 manifest with empty `permissions` and `host_permissions` arrays.

## Verification

Ran successfully after `npm ci`:

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

- `npm test`: 14/14 passed, including the clean packed-consumer CLI integration.
- `npm run test:e2e`: 44/44 passed across Chromium desktop and 390×844 mobile, including demo/reset, invalid/recovery, keyboard, privacy, offline reload/update, reduced motion, reports, response headers, and all claim checks.
- The four repaired claim commands were also run independently: `@claim:download-artifacts`, `@claim:no-install-cli`, `@claim:free-product`, and `@claim:static-deployment-contract` (2/2 browser projects each).
- `npm run test:extension`: passed; axe 0, console 0, external requests 0, storage 0, and no permissions/host access.
- `/opt/fleet/lib/verify-url.sh` against the live site: HTTP 200, 715 ms load, title/lang/one h1/main/alt/button checks passed, console errors 0.
- Playwright AxeBuilder audits in the browser suite: zero violations on desktop, 390 px demo, legal pages, dark theme, and reduced-motion flows. The standalone `@axe-core/cli` was attempted but its bundled ChromeDriver supports Chrome 152 while this worker supplies Chromium 145; the Playwright axe integration is the passing equivalent in this environment.
- Live Lighthouse 12.8.2: Performance 100, Accessibility 100; FCP 1.0 s, LCP 1.1 s, TBT 0 ms, CLS 0, transferred 49 KiB.

## Run / deploy

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run test:extension
```

The deployment is static from `dist/site`. After a deployment, verify both `/downloads/` responses for 200, MIME type, attachment disposition, size, hash, a directly executable CLI, and an MV3 ZIP manifest.

## Known gaps

No product gaps remain from verification 3. The only tool limitation is the worker image's standalone axe CLI ChromeDriver/Chromium version mismatch; the repository retains equivalent Playwright AxeBuilder coverage that passes in the supplied browser.
