# Independent product verification 2 — FAIL

Verified at: `2026-08-30T06:18:10Z`  
Candidate: `795d380282f4a4dd839ca8c05a481a0ac1592a0a` (`main`)  
Live URL: <https://webmcp-safety-check.sociobot.in>  
Work order: `webmcp-safety-check-verify-2`

## Verdict

**FAIL.** The candidate is not releasable. The live extension and CLI downloads both return 404, the exact claim commands cannot run successfully from an installed clean clone without an undocumented prior build, and the core checker accepts malformed declaration values as complete safety claims.

The cold first-read gate passes, and the web inspector, packaged extension, CLI, offline shell, privacy posture, accessibility automation, and performance are otherwise strong.

## First-read and demo gate

**PASS.** A cold desktop visit shows:

- what it does: “Inspect tool claims before an agent acts.”;
- who it is for: “For web teams deciding whether browser tools are ready for agent use.”;
- what to click first: **Try it with sample data**;
- what happens next: “Loads a sample with missing safety declarations.”

The action is on the first screen. One click opens `/?demo=1#inspector`, immediately renders “Block exposure,” and shows the persistent “Demo — sample data, nothing is saved” banner. **Reset demo** restores the sample. **Start for real** returns to `/`, removes the banner and sample, and leaves local/session storage empty.

## Release-blocking defects

### P0 — Both public product downloads return 404

The live calls to action do not deliver either required artifact:

| URL | Fresh live response | Candidate build |
| --- | --- | --- |
| `/downloads/webmcp-safety-check.mjs` | `404 text/html`; Azure 404 body, 2,400 bytes, SHA-256 `0a76274e99e285c9d7e18d094e71ea6fca1b0274e30c28492a24218e53c61cb3` | JavaScript CLI, 17,187 bytes, SHA-256 `ba021f64c7d1a3cbb065eb62d81a339c168f425e13296535dda0b725bc95da20` |
| `/downloads/webmcp-safety-check-chrome.zip` | `404 text/html`; same Azure 404 body | Chrome MV3 zip, 206,458 bytes with `PK` signature |

The landing header, hero, and CLI section link to these URLs. Users therefore cannot obtain the browser extension or CLI from the product. This independently reproduces the earlier deployment class of failure despite the prior repair handoff stating both downloads were live.

The `@claim:download-artifacts` test passes after a local build because it only reads files under `dist/site`; it never follows either served download URL. It therefore does not prove its public “Downloads…” claim and did not detect this deployment failure.

### P1 — Every exact claim command fails from the installed clean clone

`.factory/claims.json` exists and lists five claims. Per the work order, each exact `test` command was run after `npm ci` and before any build. Every command timed out waiting 30 seconds for Playwright's configured web server:

| Claim | Exact command | Clean-clone result | After `npm run build` |
| --- | --- | --- | --- |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | FAIL — web server timeout | 2/2 pass |
| `download-artifacts` | `npm run test:e2e -- --grep @claim:download-artifacts` | FAIL — web server timeout | 2/2 pass |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | FAIL — web server timeout | 2/2 pass |
| `json-export` | `npm run test:e2e -- --grep @claim:json-export` | FAIL — web server timeout | 2/2 pass |
| `local-only` | `npm run test:e2e -- --grep @claim:local-only` | FAIL — web server timeout | 2/2 pass |

`playwright.config.ts` starts only `npm run preview`; Vite preview does not create `dist/site`. The claim commands need an undocumented prior production build, so none is self-contained from a clean clone. A literal pre-install run also failed because `@playwright/test` was not yet installed; the decisive evidence above is the repeated failure after the lockfile install.

### P1 — Malformed declarations are reported as complete and safe

The core checker validates only `effect`. It stringifies invalid `null` values for approval/profile/credentials/origins and turns evidence values into key-presence booleans. This input:

```json
{"name":"nonsense","description":"tool","inputSchema":{},"x-webmcp-safety":{"effect":"read","approval":null,"evidence":{"before":false,"after":false},"profile":null,"origins":null,"credentials":null}}
```

produces CLI exit `0`, status `clear`, score `100`, zero blockers, zero warnings, and “All reviewed claims are present.” The output reports `approval`, `profile`, and `credentials` as the string `"null"`, origins as `["null"]`, and evidence as `{ "before": true, "after": true }`.

The shipped “safe” example declares evidence `{ "before": false, "after": true }`, but the generated report changes it to `{ "before": true, "after": true }`. A safety inventory must preserve and validate declared values; otherwise it can present invalid or unavailable safeguards as complete.

### P1 — Public claims are missing from the required claim registry

The landing page, privacy page, and README contain testable promises not listed in `.factory/claims.json`, including:

- no extension host permissions or browser access;
- accepted manifest, JSON-RPC transcript, transcript-array, and JSONL formats;
- the 2 MB browser limit;
- CLI exit-code and policy behavior;
- Markdown/print review-card export;
- no persistence for real (non-demo) input and reports;
- no analytics, CDN scripts, third-party fonts, or input/report service-worker caching;
- specific classification rules such as external navigation without origins and real-profile use without credential scope becoming blockers.

Some are covered incidentally by other tests or this verification, but the claims contract requires each public claim to have its own tagged registry test. The download claim also demonstrates why incidental filesystem coverage is insufficient.

## Other defects

### P2 — Required site discovery, social metadata, and real 404 are absent

- `/sitemap.xml` returns 404.
- `/404.html`, `/404/`, and an unknown route return the homepage with HTTP 200; there is no designed 404 page.
- The landing document has no canonical link, Open Graph image, Twitter card metadata, or apple-touch icon.
- Footers do not include “Built by Param Factory” or a version/build identifier.
- README documents build output but does not provide a deployment procedure.

### P2 — Two mobile controls miss the 44 px touch-target baseline

At 390 × 844, **Copy command** measured 138 × 39 CSS px and **View a complete example** measured 241 × 19 CSS px. The page has no horizontal overflow, but these targets are below the required 44 px height.

### P2 — Development dependencies contain known high/critical advisories

`npm audit --omit=dev --audit-level=high` reports zero production vulnerabilities. Full `npm audit` reports 11 development findings: 4 critical, 5 high, and 2 moderate. Direct affected packages include `vite@6.3.4`, `vitest@3.1.2`, and `wxt@0.20.6`; fixed versions are available for Vite and Vitest.

### P3 — The CLI silently ignores unknown options

Running the packed CLI with a valid manifest and `--bogus` exits 0 and prints a clear report instead of rejecting the unknown option. Input errors and invalid `--format` values do correctly exit 2.

### P3 — Axe reports one moderate landmark issue

Both light and dark demo audits report `landmark-complementary-is-top-level` for the demo banner `<aside>` nested inside the workbench section. Serious and critical counts are zero.

## Candidate verification that passed

### Clean install, tests, build, and packaging

- Confirmed `HEAD` and `origin/main` at `795d380282f4a4dd839ca8c05a481a0ac1592a0a` before testing.
- `npm ci`: completed from the lockfile.
- `npm test`: 7/7 passed, including the packed clean-consumer stdin regression.
- `npm run typecheck`: passed. There is no lint script.
- `npm run build`: passed and produced `dist/site`, the extension, the standalone CLI, and the zip.
- `npm run test:e2e`: 16/16 passed after the production build across desktop and 390 px projects.
- Each claim command passed 2/2 after the build, which confirms the underlying local behaviors but does not cure the clean-clone claim-gate failure.

### Web inspector behavior

- Incomplete sample: “Block exposure” with the expected missing effect, approval, and evidence findings.
- Complete JSONL transcript: “Claims complete,” 100%, correctly identified as a transcript.
- Invalid JSON and valid JSON with no tools: specific alert text, alert focus, and successful recovery on the next valid input.
- Exact 2 MiB file: accepted. A 2 MiB + 1 byte file: rejected with the documented corrective message and alert focus.
- Markup-like tool names/descriptions remain text; no injected image/script nodes or errors.
- Clear/Undo restores input. JSON and Markdown downloads contain the generated report.
- Demo reset and exit boundaries work; local/session storage remain empty.

### Browser extension and CLI

- The locally built zip was unpacked into a clean Chromium profile. Its popup classified incomplete and complete inputs, recovered from malformed JSON, had zero serious/critical axe findings and no console errors, used only `chrome-extension:` requests, and left storage empty.
- Built MV3 manifest has `permissions: []` and `host_permissions: []`.
- The npm package was installed into a clean temporary consumer. Help/version, safe file (exit 0), incomplete file (exit 1), stdin sentinel, JSON/stdout, and `--out` worked. Invalid/empty input, bad format, and missing file exited 2.

### Live privacy, accessibility, responsive behavior, offline, and headers

- Desktop and 390 px demo: no console/page/request failures, no horizontal overflow, one h1, one main landmark, `lang=en`, labelled controls, and zero axe serious/critical findings.
- Light and dark treatments both had zero serious/critical axe findings. Reduced motion reduced animation and transition duration to `0.01ms` and disabled smooth scrolling.
- First Tab focused **Skip to main content** with a visible 3 px ochre outline. Activating it caused the next Tab to enter main content.
- Live request log for the complete demo/reset flow contained seven GETs, all to `https://webmcp-safety-check.sociobot.in`; no analytics or third-party origin appeared.
- Service worker update completed with no waiting worker. Cache `webmcp-safety-check-75ec3ba38a9ef2cd` controlled the page; an offline reload at 390 px rendered the demo and accepted analysis with no console errors.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200, 801 ms load, title/lang/h1/main/alt checks passed, no page or console errors.
- Main HTML sends CSP, Permissions-Policy, HSTS, strict referrer policy, and `nosniff`. Hashed JS sends `Cache-Control: public, max-age=31536000, immutable`; `sw.js` sends `no-cache`.
- There are no server-side endpoints, authentication, or product-unlock calls, so 429/Retry-After and Entra checks are not applicable.

### Performance and budgets

- Lighthouse 12.8.2 live mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 70 ms, CLS 0, 49,405 transferred bytes.
- Initial JS: 19,752 bytes raw / 7,451 bytes gzip.
- Initial CSS: 15,165 bytes raw / 4,552 bytes gzip.
- Mobile hero WebP: 32,920 bytes. No web fonts ship.

All required budgets pass.

## Deployment identity

Twenty-one deployed non-download files—including the homepage, all fingerprinted JS/CSS, service worker, legal pages, examples, icons, schema, and hero images—matched the candidate build byte-for-byte. The homepage SHA-256 is `dc92ef62d3f2daf80fc2095036841ac160878a3ef47745bf45ca6e2ffc9c9e6c`; main JS is `5ecb4e2f04c67a277e7cb2672c51cde40b21925d0fc5ea89e097c0a9e1a8295d`.

The deployment is therefore substantially candidate `795d380…`, but it is incomplete because both required files under `/downloads/` are absent. No unrelated service, database, Key Vault, DNS, billing, or infrastructure resource was read or modified.

## Required remediation

1. Deploy both files from `dist/site/downloads/` and verify the public links return the correct types, attachment headers, sizes, and contents.
2. Make every claim test self-contained from an installed clean clone (for example, build in Playwright's web-server command) and make the download test exercise served URLs.
3. Validate declaration value types/enums and preserve actual evidence booleans in reports; add adversarial fixtures.
4. Register every testable public promise in `.factory/claims.json` with one observable tagged test.
5. Add the required 404/discovery/social/footer metadata and correct the two small mobile targets.
6. Upgrade vulnerable development dependencies and reject unknown CLI options.
