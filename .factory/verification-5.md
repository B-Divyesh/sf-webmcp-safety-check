# Independent product verification 5 — PASS

Verified at: `2026-09-01T20:05:46Z`  
Candidate: `0511ce5e99b76dc36e9e464e83c439f359a627e1` (`main`, equal to `origin/main` before this report)  
Live URL: <https://webmcp-safety-check.sociobot.in>  
Work order: `webmcp-safety-check-verify-5`

## Verdict

**PASS.** The candidate satisfies the researched brief and factory acceptance contract. The web inspector, downloadable MV3 extension, and standalone CLI work end to end. The live release matches the candidate. The missing-download condition recorded in verification 4 is resolved.

No P0, P1, P2, or P3 product defects remain open from this verification.

## First-read and demo gate

**PASS.** A cold 1440×900 visit shows, without scrolling:

- what it does: “Inspect tool claims before an agent acts.”;
- who it serves: “For web teams deciding whether browser tools are ready for agent use.”;
- what to click: **Try it with sample data**;
- what happens next: “Loads a sample with missing safety declarations.”

The same four items are visible within a 390×844 first screen. The sample action occupies 255.6×46.8 CSS pixels at that width. One click opens `/?demo=1#inspector`, displays “Demo — sample data, nothing is saved,” and renders a **Block exposure** review in 510 ms. **Reset demo** restores the sample. **Start for real** removes it without writing browser storage.

## Mandatory claim gate

`.factory/claims.json` exists with 22 entries. A literal first command before dependency installation could not load `@playwright/test`, as expected for a clean clone without `node_modules`. After the required `npm ci`, every exact command in the manifest was run independently and passed. Each claim ID appears in exactly one tagged test; there are no missing, duplicate, or extra claim tags.

| Claim | Result |
| --- | --- |
| `offline-reload` | PASS — 2 browser projects |
| `download-artifacts` | PASS — 2 browser projects |
| `no-install-cli` | PASS — 2 browser projects |
| `demo-sandbox` | PASS — 2 browser projects |
| `json-export` | PASS — 2 browser projects |
| `review-card-export` | PASS — 2 browser projects |
| `local-only` | PASS — 2 browser projects |
| `no-tracking-assets` | PASS — 2 browser projects |
| `no-persistence` | PASS — 2 browser projects |
| `extension-no-access` | PASS — 2 browser projects |
| `input-formats` | PASS — targeted Vitest check |
| `input-size-limit` | PASS — 2 browser projects |
| `cli-policy` | PASS — targeted Vitest check |
| `classification-policy` | PASS — targeted Vitest check |
| `declaration-validation` | PASS — targeted Vitest check |
| `claim-inventory` | PASS — targeted Vitest check |
| `declaration-sources` | PASS — targeted Vitest check |
| `unknown-fields` | PASS — targeted Vitest check |
| `open-source` | PASS — 2 browser projects |
| `free-product` | PASS — 2 browser projects |
| `static-deployment-contract` | PASS — 2 browser projects |
| `asset-provenance` | PASS — targeted Vitest check |

The landing page, legal pages, README, demo documentation, and copy audit were cross-checked against this registry. No unlisted testable product claim was found.

## Clean install and repository gates

- `npm ci`: PASS — 212 packages installed from the lockfile; zero reported vulnerabilities.
- `npm audit --audit-level=moderate`: PASS — zero vulnerabilities.
- `npm audit --omit=dev --audit-level=high`: PASS — zero vulnerabilities.
- `npm test`: PASS — 14/14 unit and integration checks.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS — produced `dist/site`, the standalone CLI, MV3 extension, ZIP, and versioned service worker.
- `npm run test:e2e`: PASS — 44/44 across desktop Chromium and 390×844 mobile.
- `npm run test:extension`: PASS — distributed ZIP loaded in a clean Chromium profile; axe 0, console errors 0, external requests 0, storage 0.

## End-to-end product evidence

- The one-click sample produces five blockers, three warnings, and the expected declaration inventory.
- A complete shipped manifest recovers to **Claims complete** with 100% coverage.
- Malformed JSON produces “This is not valid JSON…” and moves focus to the alert; valid input succeeds immediately afterward.
- A valid empty tools array produces a focused, specific “no tools were present” message and then recovers.
- A 2,097,152-byte file is accepted. A 2,097,153-byte file is rejected with a focused message that explains how to continue.
- External navigation without origin scope and real-profile use without credential scope each produce a blocker.
- JSON and Markdown downloads contain the expected blocking review; the print path is covered by the full browser suite.
- Clear shows the empty state and a five-second **Undo clear** action. Undo restores the input and the review can be rerun.

## CLI and extension

The package was packed and installed into a new temporary consumer. The installed CLI handled file input, stdin, JSON output, and `--out`. Observed exit codes were `0` for complete input, `1` for policy findings, and `2` for malformed input. The error text identifies invalid JSON.

The live standalone CLI is byte-identical to the candidate and returns a clear report with zero blockers for the shipped complete sample. The downloaded Chrome ZIP passes `unzip -t`, declares Manifest V3, reports version `1.0.1`, and has empty `permissions`, `host_permissions`, and content-script lists. Because the live ZIP is byte-identical to the locally smoke-tested ZIP, the packaged-extension results apply directly to the download.

## Live identity, routes, and downloads

All 27 deployable files under `dist/site` except the deployment-only configuration file were requested from production. Every response body matched the candidate byte-for-byte. The designed missing route returned HTTP 404 and exactly matched `dist/site/404.html`.

| Public artifact | Status / type | Bytes | SHA-256 | Candidate match |
| --- | --- | ---: | --- | --- |
| `/downloads/webmcp-safety-check.mjs` | `200 text/javascript`, attachment | 19,631 | `be1178110950b6e2283072f5e26248311735259951f43864534d40d0d0fcea34` | yes |
| `/downloads/webmcp-safety-check-chrome.zip` | `200 application/zip`, attachment | 309,987 | `669e0565577a840edb0c6a6244bffee42490e2c6f36ec8765dab86eb11366646` | yes |

`/`, `/privacy/`, and `/terms/` return 200 with route-specific titles, one h1, one main landmark, and correct canonical URLs. All internal links, hash targets, both downloads, the complete example, and both public repository links resolve. An unknown route returns the designed 404 with a way back.

## Privacy, accessibility, responsive behavior, and offline use

- A live demo/export/error/recovery/policy/storage sequence made 28 requests. Every request was a same-origin GET. Request failures, console errors, and page errors were all zero.
- A unique private marker was absent from localStorage, sessionStorage, IndexedDB, and every service-worker cache body.
- Live desktop light-theme and mobile dark/reduced-motion axe scans reported zero violations, including zero serious or critical findings.
- At 390×844, document width remained 390 CSS pixels and no visible interactive target was smaller than 44×44 CSS pixels.
- A fresh keyboard-only visit focused **Skip to main content** first with a visible `3px` outline. Activating it made the next stop the primary action inside main. Arrow keys changed the input tabs.
- Reduced motion set the report animation to `0.00001s` and page scrolling to `auto`.
- The service worker controlled the page with cache `webmcp-safety-check-bfb46a5dbe724fca`. `registration.update()` left no waiting worker. The 390px demo reloaded offline and retained a working input and review.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200; 792 ms network-idle load; title, language, one h1, main, alt text, and button names passed; console errors 0.

The field-guide visual system matches `.factory/design.md`: warm paper and botanical inks in light mode, an ink-dark mobile treatment, serif display type, monospaced evidence text, ruled specimen structure, original generated field-guide art, and reduced-motion behavior. Image provenance is documented and tested.

## Headers, caching, and performance

The homepage sends CSP with `frame-ancestors 'none'`, Permissions-Policy, HSTS, `nosniff`, and strict-origin referrer policy. Fingerprinted assets send `public, max-age=31536000, immutable`; `sw.js` sends `no-cache`; downloads send a one-hour public cache policy and attachment disposition.

Fresh live Lighthouse 12.8.2 mobile results:

| Category or metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.99 s |
| LCP | 1.12 s |
| TBT | 41.5 ms |
| CLS | 0 |
| Transferred | 49,888 bytes |

Production budgets pass: initial JavaScript is 20,100 bytes raw / 7,359 bytes gzip; main CSS is 13,553 bytes raw / 3,648 bytes gzip; the mobile hero is 32,920 bytes; no web fonts are referenced.

## Applicability notes

The repository and recorded live traffic show a static site with no server-side product endpoint, product-unlock call, account flow, or persistent backend. Request-allowance/429, server concurrency, database persistence, and Entra authority checks are therefore not applicable.

No product code, deployment, infrastructure, DNS, billing, database, secret store, or unrelated service was modified or inspected during this verification.
