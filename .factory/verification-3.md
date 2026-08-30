# Independent product verification 3 — FAIL

Verified at: `2026-08-30T07:36:37Z`  
Candidate: `8630d958c5400d3838e9a501ac112436b0225d2e` (`main`, equal to `origin/main`)  
Live URL: <https://webmcp-safety-check.sociobot.in>  
Work order: `webmcp-safety-check-verify-3`

## Verdict

**FAIL.** The candidate is not releasable. Both public product downloads still return the designed 404 document, the required claims registry omits public promises, and the light-theme focus indicator does not meet the required 3:1 contrast. Meaningful UI text also falls below the 16 px product baseline.

The mandatory 19 local claim commands pass, the cold first-read/demo gate passes, and the local web inspector, extension, CLI, offline shell, privacy controls, mobile layout, and performance otherwise work.

## First-read and demo gate

**PASS.** A new browser context at 1440×900 shows, without scrolling:

- what it does: “Inspect tool claims before an agent acts.”;
- who it is for: “For web teams deciding whether browser tools are ready for agent use.”;
- what to click first: **Try it with sample data**;
- what happens next: “Loads a sample with missing safety declarations.”

One click opens `/?demo=1#inspector`, renders **Block exposure**, and shows “Demo — sample data, nothing is saved.” **Reset demo** restores the sample. **Start for real** clears it, removes the banner, and leaves local/session storage empty.

## Mandatory claim gate

`.factory/claims.json` exists with 19 entries. Every exact command was run independently after `npm ci`, before the general suite. All passed:

| Claim | Result |
| --- | --- |
| `offline-reload` | PASS — 2/2 Playwright projects |
| `download-artifacts` | PASS locally — 2/2; the live public claim fails as described below |
| `demo-sandbox` | PASS — 2/2 |
| `json-export` | PASS — 2/2 |
| `review-card-export` | PASS — 2/2 |
| `local-only` | PASS — 2/2 |
| `no-tracking-assets` | PASS — 2/2 |
| `no-persistence` | PASS — 2/2 |
| `extension-no-access` | PASS — 2/2 |
| `input-formats` | PASS — 1 targeted Vitest test |
| `input-size-limit` | PASS — 2/2 |
| `cli-policy` | PASS — 1 targeted Vitest test |
| `classification-policy` | PASS — 1 targeted Vitest test |
| `declaration-validation` | PASS — 1 targeted Vitest test |
| `claim-inventory` | PASS — 1 targeted Vitest test |
| `declaration-sources` | PASS — 1 targeted Vitest test |
| `unknown-fields` | PASS — 1 targeted Vitest test |
| `open-source` | PASS — 2/2 |
| `asset-provenance` | PASS — 1 targeted Vitest test |

Each registered ID occurs in exactly one tagged test. The download test exercises the local preview server, so its pass does not establish that the deployed artifact URLs work.

## Release-blocking defects

### P0 — Both live product downloads return 404

The header/hero extension actions and the CLI section lead to missing files:

| URL | Fresh live response | Candidate artifact |
| --- | --- | --- |
| `/downloads/webmcp-safety-check.mjs` | `404 text/html`, no `Content-Disposition`, 2,837 bytes, SHA-256 `e2da75eca9f247a111fd5dfd6637eea3f2641ff621a15726c57a9d4870d203e6` | 19,631-byte JavaScript, SHA-256 `be1178110950b6e2283072f5e26248311735259951f43864534d40d0d0fcea34` |
| `/downloads/webmcp-safety-check-chrome.zip` | `404 text/html`, no `Content-Disposition`, same 2,837-byte 404 body | 309,989-byte ZIP, SHA-256 `4db0a39b017e64b6031372e578cc25f439d60e2df8b10f7ae8c654288cbdb9e0` |

Both live bodies match the candidate’s designed `404.html`, not the advertised downloads. The smallest useful product explicitly requires a browser extension plus CLI, so neither public artifact can currently be obtained. This freshly reproduces the earlier deployment failure despite the prior handoff claiming the files were live.

### P1 — Public promises are absent from `.factory/claims.json`

The registry covers its 19 IDs well, but it does not list every testable statement on the landing page and README as required by the claims contract. Examples include:

- “Free” / “provided free of charge” on the footer and terms page;
- “No install required” beside the standalone CLI command;
- README promises that deployment serves a designed 404, immutable fingerprinted assets, CSP, and Permissions-Policy.

There is an untagged browser test for the routing/header promises, but the required registry entry and `@claim:<id>` tag are absent. The free and no-install statements are not represented by an exact claim either. This is release-blocking under the supplied rule that any unlisted claim fails review.

### P1 — Light-theme focus indicator contrast is below 3:1

The live light theme computes `:focus-visible` as a 3 px `rgb(216, 153, 40)` (`#d89928`) outline with a 3 px offset. A focused transparent header link sits on `#f4f0e3`; the contrast is **2.17:1**, below the required **3:1**. The same outline is 1.93:1 against `#eae3d0` and 2.42:1 against `#fffdf5`.

Keyboard operation itself works: the first Tab reaches the skip link, Enter moves into main content, tab arrows work, and there is no trap. Dark-theme focus contrast passes. The light-theme color token is the defect.

## Other defect

### P2 — Meaningful text is smaller than the 16 px baseline

The attached design baseline requires body text at least 16 px, and `.factory/design.md` says “Body copy is never smaller than 16 px.” Live computed sizes contradict that promise:

- hero action explanation: 14 px;
- three first-screen facts: 12 px;
- footer product/privacy statement: 13 px;
- inspector source status: 14 px;
- finding explanations: 14 px.

These are instructions, status, and explanatory copy rather than incidental decoration.

## Verification that passed

### Clean install, quality gates, and build

- `npm ci`: passed; 212 packages; zero reported vulnerabilities.
- `npm audit --audit-level=moderate`: zero vulnerabilities.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.
- `npm test`: 14/14 passed across analyzer, product-contract, and packed-consumer suites.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run typecheck`: passed.
- Exact `npm run build`: passed and produced `dist/`, the MV3 extension, standalone CLI, static site, versioned service worker, and ZIP.
- `npm run test:e2e`: 36/36 passed across desktop Chromium and 390×844 mobile.
- `npm run test:extension`: passed; axe 0, console 0, external requests 0, storage 0, browser permissions 0, host permissions 0.

### Product behavior

- Incomplete sample: blocking card with missing effect, approval, and evidence findings.
- Complete safe manifest: **Claims complete**, 100% declaration coverage.
- Invalid JSON and valid JSON with no tools: specific focused alerts; the next valid input recovers.
- File at exactly 2 MiB: accepted. At 2 MiB plus one byte: rejected with a corrective, focused error.
- JSON report and Markdown review card downloaded and parsed; print invocation is covered by the full suite.
- Clear/Undo, reset demo, and exit demo are covered by the browser suite.
- Markup in a tool name renders as text; it creates no element, request, or script effect.
- External navigation without origins blocks; real-profile use without credential scope blocks; malformed declaration types block while explicit false evidence values remain false.

### CLI and extension

A fresh `npm pack` tarball was installed into `/tmp/webmcp-qa-consumer-*` and its installed binary was exercised:

- help/version: exit 0;
- safe fixture: exit 0, `clear`, 100%, two tools;
- incomplete fixture: exit 1, `block`, five blockers;
- stdin sentinel: exit 0;
- empty tools input: exit 2 with an input error;
- unknown option: exit 2 with the option named;
- JSON file output: valid and parseable.

The unpacked MV3 package is version 1.0.1 with `permissions: []` and `host_permissions: []`. Its popup handled incomplete, malformed, and complete data with no console errors or external traffic.

### Privacy, accessibility, responsive behavior, and offline use

- A live demo/reset/export/invalid/recovery/exit sequence made 21 requests; all were same-origin GETs. There were no request failures, console errors, or page errors.
- A private marker remained absent from localStorage, sessionStorage, IndexedDB, and every service-worker cache response.
- Live desktop and 390 px dark/reduced-motion demo audits had zero axe violations (therefore zero serious/critical findings).
- Mobile width was exactly 390 px with no horizontal overflow and no visible interactive target below 44×44 px.
- Reduced-motion report duration was `0.00001s`; smooth scrolling was disabled.
- Service-worker update left no waiting worker. Cache `webmcp-safety-check-ad8a153b3309f082` controlled the page; offline reload rendered the demo and ran inspection with no console errors.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200, 634 ms load, title/lang/one h1/main/alt/button checks passed, console errors 0.
- Home responses include CSP with `frame-ancestors 'none'`, Permissions-Policy, HSTS, strict referrer policy, and `nosniff`. Fingerprinted assets are one-year immutable; `sw.js` is `no-cache`.

### Routing, identity, and performance

- `/`, `/privacy/`, and `/terms/` return 200 with route-specific titles, one h1, one main, canonical/social metadata, and the required footer identity.
- An unknown route returns the candidate 404 page with HTTP 404. All non-download internal links and both GitHub links returned 200.
- Of 27 deployable candidate files excluding `staticwebapp.config.json`, 25 matched live byte-for-byte. The only mismatches are the two absent downloads. The live homepage matches candidate SHA-256 `83bcd0831082b28042cff7216dfb41c57701bebde7942f36238f9d175e877161`.
- Lighthouse 12.8.2 live mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.028 s, LCP 1.080 s, TBT 23 ms, CLS 0; transferred 49,896 bytes.
- Initial JS: 20,811 bytes raw / 7,780 bytes gzip. Initial CSS: 15,336 bytes raw / 4,567 bytes gzip. Mobile hero: 32,920 bytes. Fonts: 0 bytes. All budgets pass.

This is a static product with no server API, unlock call, authentication, or persistent backend. Rate-limit/429, Entra, concurrency, and database-boundary checks are not applicable.

## Required remediation

1. Publish both candidate files under `/downloads/`; verify status, type, attachment header, size, hash, and execute the downloaded CLI/load the downloaded ZIP.
2. Add registered tagged claims (or remove the copy) for every currently unlisted promise.
3. Change the light focus token or indicator treatment to achieve at least 3:1 against every adjacent light surface.
4. Raise meaningful 12–14 px text to the 16 px baseline or amend the governing design contract with an accessible, accepted exception.
5. Re-run independent verification against the repaired candidate and live deployment.

No product code, deployment, infrastructure, DNS, billing, database, Key Vault, or unrelated service was modified or inspected during this verification.
