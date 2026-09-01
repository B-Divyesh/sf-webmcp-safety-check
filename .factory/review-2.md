# First-read review 2 — WebMCP Safety Check

- Reviewed: 2026-09-01
- Candidate: `cb14ee9560a5555370faaf565ccce06bba0a7b26`
- Live site: <https://webmcp-safety-check.sociobot.in>
- Work order: `webmcp-safety-check-review-2`

## Verdict: PASS

No blocking, major, minor, unlisted-claim, copy, routing, accessibility, privacy, or missed-leverage finding remains. The full checklist was repeated from fresh mobile and desktop browser contexts; this was not a diff-only review.

## Cold first screen

Fresh contexts opened `/` at 390 × 844 and 1440 × 900 without scrolling.

| Question | Answer visible on first screen |
| --- | --- |
| What does this do? | It checks what browser tools claim they can do before an agent acts. |
| Who is it for? | Web teams deciding whether browser tools are ready for agent use. |
| What should I click first? | **Try it with sample data**. |
| What happens next? | It loads a sample with missing safety declarations. |

The headline is seven words. The audience sentence is 12 words, the action explanation is eight words, and the primary target measured 255.56 × 46.80 CSS pixels on the phone. The result is clear inside 30 seconds without requiring prior WebMCP knowledge.

Selecting the primary action opened `/demo/` on both viewports, focused `Review sample browser tools`, showed `Demo — sample data, nothing is saved.`, and showed a populated `Block exposure` report. The only observed requests were same-origin GET requests; neither context produced a console error.

## Full copy audit

Word counts exclude code examples, URLs, and generated report values. All landing and README prose, labels, list items, and actions are included below. No sentence exceeds 22 words. No banned marketing adjective, unexplained slogan, ambiguous section heading, inconsistent term, or non-result-naming action remains.

### Landing page and product states

| Copy | Words |
| --- | ---: |
| Check what browser tools say they can do | 9 |
| Inspect tool claims before an agent acts. | 7 |
| For web teams deciding whether browser tools are ready for agent use. | 12 |
| See what each tool says it can change, access, and ask you to approve. | 15 |
| Try it with sample data | 5 |
| Download extension | 2 |
| Loads a sample with missing safety declarations. | 8 |
| Free | 1 |
| Works offline after the first visit | 6 |
| Files stay on your device | 5 |
| Illustration of a browser-tool declaration review | 6 |
| How it works | 3 |
| Review browser-tool declarations in three steps. | 6 |
| Open a manifest or transcript | 5 |
| Use a manifest, tools/list response, transcript array, or JSONL transcript. | 10 |
| The file stays on your device. | 6 |
| Review missing and invalid declarations | 5 |
| See declared values, omissions, invalid values, risky combinations, and description-only signals per browser tool. | 14 |
| Export the review or run it in CI | 8 |
| Export JSON or a printable review card. | 7 |
| Run the same rules in CI. | 6 |
| Inspect a manifest or transcript | 5 |
| Maximum 2 MB. | 3 |
| What this check cannot confirm | 6 |
| This checks declarations, not tool behavior. | 7 |
| Servers provide these declarations. | 5 |
| WebMCP Safety Check spots missing and invalid declarations. | 8 |
| It does not execute tools, observe runtime behavior, scrape pages, or certify a vendor. | 15 |
| Fail on missing safety declarations. | 5 |
| The standalone Node 20+ CLI exits 1 when required effect, approval, or before/after evidence declarations are missing. | 16 |
| Add stricter declarations with a checked-in policy file. | 8 |
| Download CLI | 2 |
| No install required | 3 |
| Copy command | 2 |
| Declaration format | 2 |
| Add safety declarations by hand. | 5 |
| Use x-webmcp-safety, metadata.safety, or standard annotations.readOnlyHint. | 8 |
| Unknown future keys stay in your manifest and the checker ignores them. | 12 |
| View a complete example | 5 |
| Free, local-first, and open source. | 5 |
| See how the illustration was made. | 6 |
| Demo — sample data, nothing is saved. | 6 |
| This sample stays in page memory. | 6 |
| Reset demo | 2 |
| Clear sample and inspect your data | 7 |
| Choose file | 2 |
| Paste JSON | 2 |
| Drop a manifest or transcript here | 6 |
| Choose a manifest | 3 |
| Ready for a local file or pasted document. | 8 |
| Load incomplete sample | 3 |
| Inspect declarations | 2 |
| Clear input | 2 |
| Undo clear | 2 |
| No tools to review | 4 |
| You are offline. | 4 |
| Analysis and export still work; downloads and documentation links may not. | 11 |
| Page not found | 3 |
| We could not find this page. | 7 |
| Check the address or return to the inspector. | 8 |
| Open the inspector | 3 |

Terminology is consistent: **browser tool** is the object under review, **declaration** is the supplied value, **report** is the output, and **policy** is the runtime rule set. The supported input wording is consistently “manifest, tools/list response, transcript array, or JSONL transcript.”

### README

| Copy | Words |
| --- | ---: |
| WebMCP Safety Check helps web teams review MCP tools that run in a browser. | 13 |
| It runs as a browser extension, web inspector, and CLI. | 10 |
| It reviews what each browser tool says it can change, access, and ask you to approve. | 16 |
| It does not execute tools, read browser pages, verify server behavior, or certify a vendor. | 15 |
| Server declarations are claims, not proof. | 6 |
| What it checks | 4 |
| For every discovered tool, the checker records: | 7 |
| read, mutate, mixed, or external-navigation effect | 6 |
| human approval mode | 3 |
| before/after evidence behavior | 3 |
| fresh, real, or selectable browser profile | 6 |
| allowed origin scope | 3 |
| credential scope | 2 |
| The default CI policy fails when effect, approval, or evidence declarations are absent. | 13 |
| Profile, origin, and credential gaps are warnings unless a stricter policy makes them required. | 14 |
| External navigation without origin scope and real-profile use without credential scope are always blockers. | 14 |
| Supported input is a manifest, tools/list response, transcript array, JSONL transcript, or single browser tool object. | 17 |
| The browser UI accepts files up to and including 2 MB. | 11 |
| Run locally | 2 |
| Requirements: Node.js 20+ and npm. | 5 |
| Both npm run build and the deployment entry point npm run build:site create the complete static release. | 17 |
| They create: | 2 |
| The browser suite deletes prior artifacts, runs npm run build:site, then tests desktop and 390 px widths. | 16 |
| Install the extension | 3 |
| Build, then open chrome://extensions in Chrome or Chromium. | 8 |
| Enable Developer mode. | 3 |
| Choose Load unpacked and select .output/chrome-mv3/. | 6 |
| Pin WebMCP Safety Check, open it, and choose or paste a manifest/transcript. | 12 |
| The extension requests no permissions or host access. | 8 |
| It keeps input in page memory only. | 7 |
| Use the CLI in CI | 5 |
| Try the bundled sample without setup: | 6 |
| The command writes its sample manifest and review to a new temporary directory and prints that path. | 17 |
| It exits 1 because the sample intentionally has missing declarations. | 10 |
| Exit codes are stable: 0 passes, 1 means findings meet the policy threshold, and 2 means an input/configuration error. | 19 |
| Markdown is the default output; use --format json for automation. | 10 |
| Place .webmcp-safety.json in the working directory, or pass --policy path. | 10 |
| See .webmcp-safety.example.json and policy.schema.json. | 4 |
| Declaration format | 2 |
| The checker recognizes x-webmcp-safety, metadata.safety, _meta.safety, or annotations.safety. | 8 |
| It also understands MCP annotations.readOnlyHint and a true annotations.destructiveHint for the effect claim. | 13 |
| Explicit false evidence values are valid declarations; omission is the finding. | 11 |
| This format is intentionally a checker contract, not a claim of standards compatibility. | 13 |
| Track specification changes before relying on new fields. | 8 |
| The checker validates the documented values. | 6 |
| Approval accepts required, optional, or none. | 6 |
| Profile accepts fresh, real, or selectable. | 6 |
| Credential scope accepts none, origin-scoped, user-provided, or browser-session. | 8 |
| Origins must be a non-empty array of HTTP or HTTPS origins. | 11 |
| Invalid values block the review instead of counting toward declaration coverage. | 11 |
| Privacy, security, and scope | 4 |
| There are no analytics, network submissions, CDN scripts, or third-party fonts. | 11 |
| The site service worker precaches the versioned application shell and public examples for offline inspection; it never caches input or reports. | 21 |
| Inputs and reports are not persisted; exports are user-initiated downloads. | 10 |
| site/staticwebapp.config.json serves a designed 404 response, sets immutable caching for fingerprinted assets, and supplies the restrictive CSP and Permissions-Policy. | 19 |
| See the deployed /privacy/ and /terms/ documents. | 7 |
| Generated illustration provenance and the complete visual system are recorded in .factory/design.md. | 12 |
| Product verification and known gaps are in .factory/handoff.md. | 8 |
| Deploy | 1 |
| Factory workers deploy only the built static root for this product. | 11 |
| After deployment, verify both /downloads/ URLs return attachment responses and compare their SHA-256 hashes with the local artifacts. | 18 |
| No API, database, DNS, or billing configuration belongs in this repository. | 11 |
| License | 1 |
| MIT — see LICENSE. | 3 |

All claim-like lines above have an entry in `.factory/claims.json`: local/no execution and no tracking are covered by request-log checks; offline, download, CLI, demo, persistence, input, export, policy, declaration-format, free, licensing, delivery, and provenance claims each have their own tagged test. No unlisted claim was found.

## Demo, privacy, and sandbox behaviour

The dedicated `/demo/` route is one click from the first screen and also accepts the legacy `?demo=1` entry by redirecting to the dedicated route. It immediately shows a realistic two-tool sample, including `place_order`, three blockers, warnings, and the report. The persistent banner contains Reset and an explicit path out of sample mode.

Reset restored the shipped `place_order` sample. In a fresh live context, a seeded `real:keep=yes` key survived Reset unchanged; sessionStorage stayed empty and IndexedDB had no databases. Demo input and reports are page-memory-only, so the demo does not read or write real storage. A clean live request log showed only same-origin GET traffic. An adversarial manifest’s declared outside origin was not contacted in the registered request-log test.

After service-worker control, a fresh live mobile context was put offline and reloaded `/demo/`. It retained the demo URL, `Demo — WebMCP Safety Check` title, demo h1, banner, populated report, and sample input, with no console errors.

The downloaded CLI’s `--demo` path is covered by its clean temporary-consumer check; it creates a new temporary directory and returns the intentionally blocking sample’s documented exit 1. The static demo and CLI demo both meet the sandbox requirement.

## Claims and local quality gates

All 23 exact commands from `.factory/claims.json` were run independently after `npm ci`; all passed. This includes the standalone temporary-directory CLI checks and each browser claim against the demo entry point. The final Playwright run reported `status: passed` and no failed tests.

Additional current-candidate gates passed:

- `npm ci` — 212 packages installed; zero vulnerabilities reported.
- `npm test` — 15/15 tests passed.
- `npm run typecheck` and `npm run lint` — passed.
- `npm run build` — passed; produced `dist/site`, standalone CLI, MV3 extension, and ZIP.
- `npm run test:e2e` — 44/44 desktop and 390 px browser tests passed.
- `npm run test:extension` — passed.

The initial production JavaScript is 20.44 KB raw / 7.41 KB gzip and the main CSS is 14.22 KB raw / 3.75 KB gzip. No remote font or script is loaded.

## Earlier finding confirmation

Every finding from review 1 and polish round 1 was checked on the live site and in code.

| Earlier id | Confirmation |
| --- | --- |
| F-1-1 | The landing action opens `/demo/`, focuses its h1, and visibly renders its report and banner. |
| F-1-2 | `node webmcp-safety-check.mjs --demo` is implemented and exercised from a temporary consumer. |
| F-1-3 | `/demo/` has distinct title, description, canonical, social metadata, and sitemap entry. |
| F-1-4 | Required mobile controls, including legal and 404 wordmarks and the issue link, are at least 44 px high. |
| F-1-5 | The hero facts explicitly say Free, offline-after-first-visit, and files-stay-on-device. |
| F-1-6 | The first eyebrow now names what browser tools say they can do. |
| F-1-7 | The hero explains changes, access, and approval. |
| F-1-8 | The image caption describes the illustration instead of using catalog language. |
| F-1-9 | The three process headings name concrete actions. |
| F-1-10 | The inspector heading names a manifest or transcript. |
| F-1-11 | The drop prompt names a manifest or transcript. |
| F-1-12 | The empty state says `No tools to review`. |
| F-1-13 | The offline state says `You are offline.` |
| F-1-14 | The limit section says what the check cannot confirm and distinguishes declarations from behavior. |
| F-1-15 | The 404 is a real 404 and says `Page not found` / `We could not find this page.` |
| F-1-16 | Illustration provenance is a descriptive, reachable public link. |
| F-1-17 | Landing and README use the same browser-tool, declaration, report, effect, and input terms. |
| F-1-18 | `Clear input` and `Clear sample and inspect your data` name their results. |

Earlier verification failures were also rechecked: public downloads return the correct attachments, stdin CLI handling is tested, offline reload has a functioning inspector, immutable asset caching and security headers are present, declarations are type-checked, and no claim registry gap remains.

## Structure, routing, accessibility, and design

Live mobile checks returned the following: `/`, `/demo/`, `/privacy/`, and `/terms/` all returned 200; a missing route returned 404. Each had one `h1`, one `main`, `lang=en`, a route-specific title, description, canonical, Open Graph/Twitter data, favicon, touch icon, and zero axe violations. Mobile document width remained 390 px on all routes.

The header and footer are consistent, with a skip link, working Demo/Inspector/Privacy and legal navigation, and the Param Factory/version identity. Internal product links crawled from the demo returned 200, including the extension download. Browser back/forward works across real document routes; the demo route moves focus to its h1. The live origin sends a CSP with `frame-ancestors 'none'`, a Permissions-Policy, nosniff, HSTS, and strict-origin referrer policy.

The botanical field-guide identity is visibly product-specific: warm paper, field-guide serif and monospace pairing, hand-lens botanical illustration, ruled specimen sheets, risk notches, and restrained motion. It does not read as a generic SaaS template, while preserving the required header → clear first screen → working product → method → boundary → CLI → format → footer order.

## Missed leverage

No feature is missing from the brief’s job. The product supports browser-extension, web-inspector, and CLI use; accepts the relevant inputs; exports JSON, Markdown, and printable review cards; and runs in CI. An AI step would not improve a deterministic declaration and policy check, and could reduce the evidentiary certainty the product promises. There is no decorative or key-embedding AI feature.

## What would make this perfect

The current release has no open product or QA work. Preserve this state by keeping the one-click demo, local-only request-log checks, CLI temporary-directory demo check, and complete copy audit in the release suite whenever the format or policy evolves.
