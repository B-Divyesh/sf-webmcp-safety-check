# Independent product verification 7 — PASS

Verified at: `2026-09-01T22:36:15Z`  
Candidate: `649d7ffadfa2060110ffbd6d579b46295b87f943` (`main`, equal to `origin/main` before this report)  
Live URL: <https://webmcp-safety-check.sociobot.in>  
Work order: `webmcp-safety-check-verify-7`

## Verdict

**PASS.** The candidate fulfills the researched browser-extension plus CLI job, every mandatory claim test passes, the live deployment is byte-identical to the candidate release, and the two P2 defects from verification 6 are fixed. No P0, P1, P2, or P3 defects were found.

## First-read and one-click demo gate

**PASS on desktop and 390 px mobile.** A cold page states, without scrolling:

- what it does: `Inspect tool claims before an agent acts.`;
- who it serves: web teams deciding whether browser tools are ready for agent use;
- what to click first: `Try it with sample data`;
- what happens: `Loads a sample with missing safety declarations.`

At 390×844, the h1, audience sentence, primary action, and action explanation all fit in the first viewport. The primary action is `255.56 × 46.80` CSS pixels. One click opens `/demo/`, focuses `Review sample browser tools`, shows the persistent `Demo — sample data, nothing is saved` banner, and renders a populated `Block exposure` review. Reset restores the shipped `place_order` sample. Leaving demo returns to an empty real inspector. localStorage, sessionStorage, and IndexedDB remain empty.

Evidence: `verification-7-first-read-desktop.png`, `evidence/verification-7-live-root/`, and `evidence/verification-7-live-demo/`.

## Mandatory claims gate

`.factory/claims.json` exists with 23 entries. After the clean `npm ci`, every listed `test` command was run separately through the documented demo path. **23/23 passed:**

| Claim IDs | Result |
| --- | --- |
| `offline-reload`, `download-artifacts`, `no-install-cli`, `cli-demo` | PASS |
| `demo-sandbox`, `json-export`, `review-card-export` | PASS |
| `local-only`, `no-tracking-assets`, `no-persistence`, `extension-no-access` | PASS |
| `input-formats`, `input-size-limit`, `cli-policy`, `classification-policy` | PASS |
| `declaration-validation`, `claim-inventory`, `declaration-sources`, `unknown-fields` | PASS |
| `open-source`, `free-product`, `static-deployment-contract`, `asset-provenance` | PASS |

The landing page, legal pages, README, demo guide, and copy audit were cross-checked against the registry. No unlisted material claim was found.

## Clean install and repository gates

- `npm ci`: PASS — 212 packages installed; zero reported vulnerabilities.
- `npm audit --audit-level=moderate`: PASS — zero vulnerabilities.
- `npm audit --omit=dev --audit-level=high`: PASS — zero vulnerabilities.
- `npm test`: PASS — 15/15 unit and integration tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS — exact production command produced `dist/site`, the standalone CLI, MV3 extension, and ZIP.
- `npm run test:e2e`: PASS — 44/44 desktop and 390 px tests.
- `npm run test:extension`: PASS — clean Chromium extension load; axe 0, console errors 0, external requests 0, storage 0.

The production site build contains 20.44 KB raw / 7.41 KB gzip main JavaScript and 14.22 KB raw / 3.75 KB gzip main CSS. The responsive mobile hero is 32.92 KB. No font payload ships.

## End-to-end product behavior

- The incomplete sample reports `Block exposure`, 50% declaration coverage, 3 blockers, 3 warnings, and 6 missing claims across two realistic tools.
- A complete manifest recovers to `Claims complete`, 100% coverage, and zero blockers or warnings.
- Malformed JSON produces a specific focused alert. A valid empty tools array produces a different focused alert. Valid input succeeds immediately afterward.
- An exact 2,097,152-byte file is accepted; a 2,097,153-byte file is rejected with a focused recovery instruction.
- JSON export parses with blocking status. Markdown review export has the expected heading. Print invokes the browser print path. Clear offers undo and restores the review.
- Manifest, `tools/list`, transcript array, JSONL, and single-tool envelopes pass. The declared safety locations, policy combinations, false evidence values, wrong types, and unknown future keys are covered.

## CLI and extension packaging

A fresh `npm pack` was installed into a newly created consumer. Its binary:

- returned structured JSON and exit 0 for the shipped complete manifest;
- ran `--demo`, wrote its sample and review to a new temporary directory, and returned the documented exit 1;
- returned exit 2 with a clear input error for an empty object.

The live standalone CLI was downloaded into a new temporary directory and ran directly with Node against the live complete sample. It returned a 100% clear report with exit 0.

The extension smoke test loaded the built Manifest V3 package in a clean Chromium profile. The manifest has empty `permissions` and `host_permissions` arrays and no content script. Since the live ZIP is byte-identical to that tested package, the deployed extension is the tested artifact.

## Live deployment identity and delivery

All 28 public files in `dist/site` other than deployment-only `staticwebapp.config.json` were fetched from production and compared by SHA-256. **28/28 match.** This includes the exact 404 response body.

| Artifact | Live status/type | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `/downloads/webmcp-safety-check.mjs` | `200 text/javascript`, attachment | 21,079 | `72f8a28b64120d99453991ab5ab30f3c90785d7df264c9cc5342690a5b01e92f` |
| `/downloads/webmcp-safety-check-chrome.zip` | `200 application/zip`, attachment | 310,043 | `0a7de318317b67c57ec700ba8d88bf2b2fd6dad2197d6637d0e6515375f674ed` |

Every discovered link on `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed 404 resolves as intended. The unknown route returns HTTP 404. `/opt/fleet/lib/verify-url.sh` passed both `/` (854 ms) and `/demo/` (707 ms) with correct titles, `lang=en`, one h1, a main landmark, complete alt text, labeled buttons, and zero console errors.

## Privacy, requests, and storage

A fresh live sample/reset flow generated 13 requests: all were same-origin GETs. It had zero failed requests, console errors, or page errors. A separate adversarial manifest named an outside origin and contained a unique marker. The browser did not request that origin. The marker was absent from localStorage, sessionStorage, IndexedDB, and every service-worker cache response after analysis.

No analytics, tracking pixel, remote script, CDN font, form submission, account request, or payment request was observed. The product has no server-side API, product-unlock endpoint, backend state, or sign-in flow. API allowance/429, concurrency/database, and Entra authority checks are therefore not applicable.

## Accessibility, mobile, motion, and offline

- Fresh live axe scans found zero violations on `/`, `/demo/`, `/privacy/`, `/terms/`, the designed 404, and the mobile dark/reduced-motion demo.
- Keyboard-only entry reaches the visible skip link first with a 3 px outline. Activating it puts the next focus inside `main`. Arrow-key tab behavior and focused error announcements pass.
- At 390×844, document width is exactly 390 px. Every visible demo control measured at least 44 px high; the repaired provenance link measures exactly 44 px high.
- Dark mode retains zero axe findings. Reduced motion changes the report animation to `0.00001s` and scroll behavior to `auto`.
- At 200% page scale, the 1440 px layout has a 720 px visual viewport; the h1, demo banner, populated report, and all 16 controls remain present and operable.
- A fresh service-worker context updated `sw.js`, reported no waiting worker, and used cache `webmcp-safety-check-b06ceb1de92e4070`. After going offline, `/demo/` retained its URL, `Demo — WebMCP Safety Check` title, `Review sample browser tools` h1, banner, and populated report with zero console errors and zero axe violations.

## Headers, caching, and performance

The live HTML and assets send HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, Permissions-Policy, and CSP with `frame-ancestors 'none'`. Fingerprinted assets send `public, max-age=31536000, immutable`; `sw.js` sends `no-cache`; downloads send attachment disposition and a one-hour public cache policy.

Fresh Lighthouse 12.8.2 mobile result for `/`:

| Category or metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 1.0 s |
| LCP | 1.1 s |
| TBT | 80 ms |
| CLS | 0 |
| Transfer | 50,130 bytes |

All static-product budgets pass. Lab INP is unavailable without interaction data; TBT is well below the 200 ms interaction budget.

## Scope and remaining work

No product code, deployment, infrastructure, DNS, billing, database, secret store, other product, or unrelated service was modified or inspected. Only this report, the handoff, and QA evidence were added. No known acceptance gaps remain.
