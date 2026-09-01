# Independent product verification 6 — FAIL

Verified at: `2026-09-01T21:35Z`  
Candidate: `e7a1d78e7197dadc509f62054549b3e1b1f9fbf6` (`main`, equal to `origin/main` before this report)  
Live URL: <https://webmcp-safety-check.sociobot.in>  
Work order: `webmcp-safety-check-verify-6`

## Verdict

**FAIL.** The candidate works for its main job and the live deployment matches the candidate, but two P2 acceptance defects remain. The mobile provenance link is below the required 44 px touch-target size. An offline reload of the dedicated demo URL serves the landing document instead of retaining the demo document title and h1.

No P0 or P1 defects were found.

## Findings

### P2 — Generated-image provenance link is below the 44 px touch-target minimum

At a 390×844 mobile viewport, the `See how the illustration was made.` link measures `327.52 × 19` CSS pixels on both `/` and `/demo/`. The acceptance contract requires touch targets to be at least 44 px high. The visually hidden file input also measures 1×1 px, but its visible, associated `Choose file` control meets the target requirement and is not a finding.

Recheck:

1. Open `/` or `/demo/` at 390×844.
2. Measure the footer provenance anchor.
3. Confirm its rendered height is at least 44 CSS pixels.

Expected: the complete interactive link has a minimum 44 px target height.  
Observed: the link height is 19 px.

### P2 — Offline `/demo/` reload does not retain the demo document

A fresh context opened `/demo/`, waited for service-worker readiness, reloaded once for control, switched offline, and reloaded again. The URL remained `/demo/`, the demo banner and sample review remained usable, and no console error occurred. However:

- title changed from `Demo — WebMCP Safety Check` to `WebMCP Safety Check — inspect browser-agent declarations`;
- h1 changed from `Review sample browser tools` to `Inspect tool claims before an agent acts.`;
- the landing first screen replaced the dedicated demo first screen.

The generated service worker precaches `/`, `/privacy/`, and `/terms/`, but not `/demo/`. Its offline navigation fallback returns `/`. This does not meet the route contract that a deep-link reload retains the correct page identity, and it weakens screen-reader orientation in the offline demo.

Recheck:

1. Open `/demo/` in a fresh context and wait for service-worker control.
2. Switch the context offline and reload `/demo/`.
3. Confirm the title remains `Demo — WebMCP Safety Check` and the h1 remains `Review sample browser tools`.

## First-read and demo gate

**PASS.** A cold 1440×900 visit shows the following without scrolling:

- what it does: `Inspect tool claims before an agent acts.`;
- who it serves: web teams deciding whether browser tools are ready for agent use;
- what to click: `Try it with sample data`;
- what follows: `Loads a sample with missing safety declarations.`

The same information and action are visible at 390×844. The primary action measures `255.56 × 46.80` CSS pixels. One click opens `/demo/`, focuses `Review sample browser tools`, shows the persistent demo banner, and renders the sample `Block exposure` review. Reset and leave-demo paths work without storage writes.

## Mandatory claim gate

`.factory/claims.json` exists with 23 entries. The mandated pre-install attempt could not load the absent local test runners in the clean clone. After `npm ci`, every exact command in the file was run independently; **23/23 passed**. The valid claim run includes:

- offline reload and one-click demo isolation;
- exact public CLI and extension downloads;
- direct Node CLI and CLI demo use;
- JSON, Markdown, and print outputs;
- local-only requests, no tracking assets, and no input persistence;
- empty extension permissions and host access;
- all documented input envelopes and the 2 MB boundary;
- policy exit codes, classification rules, declaration validation, source locations, and unknown keys;
- open-source, free-use, static delivery, and asset-provenance checks.

The landing page, legal pages, README, demo documentation, and copy audit were cross-checked with the registry. No unlisted testable claim was found.

## Clean install and repository gates

- `npm ci`: PASS — 212 packages installed; zero reported vulnerabilities.
- `npm audit --audit-level=moderate`: PASS — zero vulnerabilities.
- `npm audit --omit=dev --audit-level=high`: PASS — zero vulnerabilities.
- `npm test`: PASS — 15/15 unit and integration checks.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS — produced `dist/site`, standalone CLI, MV3 extension, ZIP, and versioned service worker.
- `npm run test:e2e`: PASS — 44/44 across desktop Chromium and 390×844 mobile.
- `npm run test:extension`: PASS — packaged MV3 extension loaded in a clean Chromium profile; axe 0, console errors 0, external requests 0, storage 0.

## Product paths and recovery

- The sample produces the expected blocking review and declaration inventory.
- The complete sample recovers to `Claims complete` with 100% coverage.
- Malformed JSON and a valid empty tools array each produce a specific, focused alert. Valid input succeeds immediately afterward.
- A 2,097,152-byte file is accepted. A 2,097,153-byte file is rejected with a focused recovery message.
- JSON and Markdown downloads use the expected names, and the print action calls the browser print path.
- Clear presents the empty state and `Undo clear`; undo restores the input and review.
- The packed npm artifact installed in a new consumer and handled the complete sample. Its demo wrote a report to a new temporary directory and returned the documented finding status.
- The downloaded live CLI handled the complete sample with status 0.
- The extension ZIP is a valid Manifest V3 package with no declared permissions, host permissions, or content scripts.

## Live identity, privacy, and routes

All 28 public files under `dist/site`, excluding the deployment-only configuration file, were requested from production and compared by SHA-256. Every response body matches the candidate. The designed unknown route returned HTTP 404 and matched `dist/site/404.html` exactly.

| Artifact | Status / type | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `/downloads/webmcp-safety-check.mjs` | `200 text/javascript`, attachment | 21,079 | `72f8a28b64120d99453991ab5ab30f3c90785d7df264c9cc5342690a5b01e92f` |
| `/downloads/webmcp-safety-check-chrome.zip` | `200 application/zip`, attachment | 310,043 | `0a7de318317b67c57ec700ba8d88bf2b2fd6dad2197d6637d0e6515375f674ed` |

All links found across `/`, `/demo/`, `/privacy/`, `/terms/`, and the 404 document resolve; internal fragments exist. Each route has `lang=en`, one h1, one main landmark, a route-specific title, description, canonical URL, Open Graph image, and Twitter card when online.

A live sample/export/error/recovery/storage sequence made only same-origin GET requests. External requests, non-GET requests, failed requests, console errors, and page errors were all zero. The unique input marker was absent from localStorage, sessionStorage, IndexedDB, and every service-worker cache body.

The product is static. It has no server-side product endpoint, product-unlock call, account flow, or persistent backend. Request-allowance/429, backend concurrency, database boundaries, and sign-in authority checks are not applicable.

## Accessibility, responsive behavior, and motion

- Live desktop light and mobile dark/reduced-motion axe scans on `/` and `/demo/` reported zero violations. The full local suite also checks legal routes.
- Keyboard entry focuses `Skip to main content` first with a visible `3px` outline; activating it places the next stop on the primary action.
- ArrowRight and ArrowLeft switch the two input tabs and update `aria-selected`.
- Invalid and empty-input errors receive focus. The demo h1 receives focus after entry.
- At 390 px, document width remains 390 px with no horizontal overflow.
- Reduced motion changes the report duration to `0.00001s` and scrolling to `auto`.
- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, 761 ms load, correct title/language/h1/main/alt/button checks, and zero console errors.
- The touch-target defect above remains release-blocking.

## Headers, caching, and performance

The live homepage sends CSP with `frame-ancestors 'none'`, Permissions-Policy, HSTS, `nosniff`, and strict-origin referrer policy. Fingerprinted assets send `public, max-age=31536000, immutable`; `sw.js` sends `no-cache`; downloads send a one-hour public cache policy and attachment disposition.

Fresh Lighthouse 12.8.2 mobile results:

| Category or metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 0.96 s |
| LCP | 1.08 s |
| TBT | 44.5 ms |
| CLS | 0 |
| Transferred | 50,088 bytes |

Initial JavaScript is 21,150 bytes raw / 7,805 bytes gzip. Initial CSS is 15,969 bytes raw / 4,642 bytes gzip. The mobile hero is 32,920 bytes. No web fonts are referenced. All specified budgets pass.

## Scope and changes

No product code, deployment, infrastructure, DNS, billing, database, secret store, or unrelated service was modified or inspected. Only this verification report and the handoff summary were changed.
