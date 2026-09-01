# Independent product verification 4 — FAIL

Verified at: `2026-09-01T19:08:41Z`  
Candidate: `6f8f1885327489ca5c72d7d6d71b6949282a6e6f` (`main`, equal to `origin/main` before this report)  
Live URL: <https://webmcp-safety-check.sociobot.in>  
Work order: `webmcp-safety-check-verify-4`

## Verdict

**FAIL.** The candidate builds and works locally, and the deployed inspector matches the candidate, but the live site does not serve either required product download. Both extension and CLI links return the designed 404 page. This prevents users from obtaining two core artifacts in the researched brief.

This is a fresh reproduction from direct network requests on 2026-09-01. It is not based on the earlier deployment report.

## First-read and demo gate

**PASS.** A cold desktop load states, above the fold:

- what it does: “Inspect tool claims before an agent acts.”;
- who it serves: “For web teams deciding whether browser tools are ready for agent use.”;
- what to click: **Try it with sample data**;
- what happens next: “Loads a sample with missing safety declarations.”

One click opened `/?demo=1#inspector`, displayed the persistent “Demo — sample data, nothing is saved” banner, and immediately rendered a **Block exposure** review with the intentionally missing declarations. Reset and Start for real are present.

## Mandatory claim gate

`.factory/claims.json` exists with 22 entries. The literal pre-install invocation from the pristine checkout could not start because `node_modules` was absent (`@playwright/test` and `vitest` were unavailable). After the required `npm ci`, every exact registered command was run independently and all 22 passed:

| Claim | Result |
| --- | --- |
| `offline-reload` | PASS — 2 browser projects |
| `download-artifacts` | PASS locally — live claim fails below |
| `no-install-cli` | PASS — 2 browser projects |
| `demo-sandbox` | PASS — 2 browser projects |
| `json-export` | PASS — 2 browser projects |
| `review-card-export` | PASS — 2 browser projects |
| `local-only` | PASS — 2 browser projects |
| `no-tracking-assets` | PASS — 2 browser projects |
| `no-persistence` | PASS — 2 browser projects |
| `extension-no-access` | PASS — 2 browser projects |
| `input-formats` | PASS — targeted Vitest test |
| `input-size-limit` | PASS — 2 browser projects |
| `cli-policy` | PASS — targeted Vitest test |
| `classification-policy` | PASS — targeted Vitest test |
| `declaration-validation` | PASS — targeted Vitest test |
| `claim-inventory` | PASS — targeted Vitest test |
| `declaration-sources` | PASS — targeted Vitest test |
| `unknown-fields` | PASS — targeted Vitest test |
| `open-source` | PASS — 2 browser projects |
| `free-product` | PASS locally — live downloads fail below |
| `static-deployment-contract` | PASS against the production-shaped local server |
| `asset-provenance` | PASS — targeted Vitest test |

The download checks use the repository's local preview server. Their local pass does not establish that production serves the files.

## Release-blocking defect

### P0 — Both live product downloads return 404

Fresh direct requests and a complete live link crawl produced:

| Public path | Live response | Candidate artifact |
| --- | --- | --- |
| `/downloads/webmcp-safety-check.mjs` | `404 text/html`; no `Content-Disposition`; 2,837 bytes; SHA-256 `41f5946d13ec55cde498b2aeecd78201b352a99d1145d093b2b341e9d7a65ff3` | 19,631-byte JavaScript; SHA-256 `be1178110950b6e2283072f5e26248311735259951f43864534d40d0d0fcea34` |
| `/downloads/webmcp-safety-check-chrome.zip` | `404 text/html`; no `Content-Disposition`; 2,837 bytes; same SHA-256 as above | 309,987-byte ZIP; SHA-256 `669e0565577a840edb0c6a6244bffee42490e2c6f36ec8765dab86eb11366646` |

Both live response bodies are byte-for-byte equal to the candidate's designed `404.html`. The header and hero extension actions and the CLI section link to these paths. The smallest useful product requires a downloadable browser extension and CLI, so this is release-blocking.

## Verification that passed

### Clean install, quality gates, build, CLI, and extension

- `npm ci`: passed; 212 packages installed; zero reported vulnerabilities.
- `npm audit --audit-level=moderate`: passed with zero vulnerabilities.
- `npm audit --omit=dev --audit-level=high`: passed with zero vulnerabilities.
- `npm test`: 14/14 passed. This includes packing the npm package, installing it in a fresh temporary consumer, and exercising the installed CLI.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run typecheck`: passed.
- Exact `npm run build`: passed and produced `dist/`, the MV3 extension, standalone CLI, static site, versioned service worker, and extension ZIP.
- `npm run test:e2e`: 44/44 passed across desktop Chromium and 390×844 mobile.
- `npm run test:extension`: passed; axe 0, console 0, external requests 0, storage 0, permissions 0, and host permissions 0.
- The packed-consumer CLI returned exit 0 for complete input, exit 1 for policy findings, exit 2 for input errors, accepted stdin, and wrote parseable JSON in the passing integration suite.

### Live product behavior

- The sample produced missing effect, approval, and before/after evidence findings.
- A complete shipped manifest recovered to **Claims complete** with 100% declaration coverage.
- Malformed JSON and an empty tools list produced specific focused alerts; valid input recovered immediately.
- A file of exactly 2,097,152 bytes was accepted. A 2,097,153-byte file was rejected with a focused corrective message.
- External navigation without declared origins and real-profile use without credential scope each produced a blocking finding.
- JSON and Markdown exports downloaded and parsed with the expected blocking status and heading.

### Privacy, accessibility, responsive behavior, and offline use

- A fresh live demo/export/invalid/recovery sequence made 14 requests. Every request was a same-origin GET; there were no request failures, console errors, or page errors.
- A unique private marker remained absent from localStorage, sessionStorage, IndexedDB, and every service-worker cache response.
- Live desktop and 390 px dark/reduced-motion audits had zero serious or critical axe findings.
- The 390 px page had no document-level horizontal overflow, no visible interactive target below 44×44 px, and no meaningful audited copy below 16 px.
- The first Tab focused the skip link with a 3 px visible outline. Activating it moved the next keyboard stop to the first main-content action. Arrow keys switched the input tabs.
- Reduced-motion report duration was `0.00001s`, and smooth scrolling was disabled.
- Service-worker update left no waiting worker. Cache `webmcp-safety-check-bfb46a5dbe724fca` controlled the page; offline reload rendered and ran the sample with no console errors.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200, 636 ms network-idle load, title/lang/one h1/main/alt/button checks passed, console errors 0.

### Routing, headers, identity, and performance

- `/`, `/privacy/`, and `/terms/` return 200 with route-specific titles, one h1, one main, and matching canonical URLs.
- A missing route returns HTTP 404 and the candidate's designed 404 page. Every crawled link except the two product downloads returned 200, including both public GitHub links.
- Home responses include CSP with `frame-ancestors 'none'`, Permissions-Policy, HSTS, strict referrer policy, and `nosniff`.
- Fingerprinted JS/CSS responses use `public, max-age=31536000, immutable`; `sw.js` uses `no-cache`.
- Of 27 deployable files excluding `staticwebapp.config.json`, 25 match production byte-for-byte. The only mismatches are the two absent downloads. The live homepage matches candidate SHA-256 `fa931b63dbbd081d340a8a0ed78f8e0ab7e52f47fbbff1506d1794d2af823cb1`.
- Lighthouse 12.8.2 live mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 0 ms, CLS 0, 49,951 bytes transferred.
- Initial JavaScript is 20,100 bytes raw / 7,318 bytes gzip. Main CSS is 13,553 bytes raw / 3,620 bytes gzip. Mobile hero is 32,920 bytes. No web fonts ship.

This is a static product with no server endpoint, product-unlock call, authentication, or persistent backend. Request allowance/429, Entra authority, concurrency, and database-boundary checks are not applicable.

## Required remediation

Publish both candidate files at the advertised `/downloads/` paths without routing them to the 404 response. Confirm 200 status, correct MIME type, `Content-Disposition: attachment`, exact candidate hash, direct CLI execution, and a valid MV3 ZIP. Then run fresh independent verification.

No product code, deployment, infrastructure, DNS, billing, database, Key Vault, or unrelated service was modified or inspected.
