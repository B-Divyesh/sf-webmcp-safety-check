# First-read review 1 — WebMCP Safety Check

- Reviewed: 2026-09-01
- Candidate: `69e5ea756c3a75799d39049cba0701ec360c46da`
- Live site: <https://webmcp-safety-check.sociobot.in>
- Work order: `webmcp-safety-check-review-1`

## Verdict: FAIL

The product has 18 findings: 2 blocking, 2 major, and 14 minor. The registered checks pass, but the primary sample action does not put the populated product in the viewport, and the public CLI has no sample command. The demo claim therefore remains only partly tested.

## Cold first screen

Fresh contexts were opened at 390×844 and 1440×900 without scrolling.

- What it does: it checks browser-tool declarations before an agent uses a tool.
- Who it serves: web teams deciding whether browser tools are ready for agent use.
- What to select first: **Try it with sample data**.
- What should happen: “Loads a sample with missing safety declarations.”

All four answers are visible on both first screens. The headline has 7 words, the audience sentence has 12, and the primary action is visually distinct. This gate passes.

## Findings

### Blocking

#### F-1-1 — The primary sample action leaves the populated product off-screen

- Location: live home page, **Try it with sample data**; `site/index.html`; `site/src/main.ts`.
- Exact copy: “Try it with sample data” and “Loads a sample with missing safety declarations.”
- Observed result: the URL becomes `/?demo=1#inspector` and the sample report is created, but the phone remains at `scrollY=2` and desktop remains at `scrollY=0`. On phone, `#inspector` starts at 1,941.6 px, the demo notice at 2,372.6 px, and the populated report at 3,012.4 px. On desktop those values are 1,466.5 px, 1,823.9 px, and 2,378.5 px. Focus is `BODY` in both cases.
- Why this fails first use: the first screen after selection looks almost unchanged. It does not show the demo notice or the product being used with sample data.
- Concrete correction: provide a dedicated `/demo/` page, or scroll after layout settles and focus a demo-specific heading. The resulting viewport must contain “Demo — sample data, nothing is saved” and the populated review at both required sizes. Add a browser check that selects the landing action and confirms the notice and report intersect the viewport and that focus moves to the demo heading.
- Claim impact: `@claim:demo-sandbox` passes because it opens the demo URL directly. It does not check the advertised one-click path or post-click viewport, so the claim is not fully covered.

#### F-1-2 — The standalone CLI has no sample command

- Location: downloaded `/downloads/webmcp-safety-check.mjs`; README “Use the CLI in CI”.
- Observed result from a new temporary directory: `node webmcp-safety-check.mjs --demo` returns exit 2 with “Unknown option: --demo”; `node webmcp-safety-check.mjs demo` returns exit 2 because it looks for a file named `demo`.
- Why this fails first use: a visitor can download the CLI, but cannot try its main job with bundled sample data without finding or creating another file.
- Concrete correction: add `--demo` or a `demo` command that uses an embedded realistic manifest, runs without setup, writes any output under a new temporary directory, and prints that path. Document the command beside the download and add a registered claim check that runs it from a new temporary directory.

### Major

#### F-1-3 — The demo URL has home-page canonical metadata and is absent from the sitemap

- Location: live `/?demo=1#inspector`, `site/index.html`, and `public/sitemap.xml`.
- Exact metadata: title is “Demo — WebMCP Safety Check”, but canonical is `https://webmcp-safety-check.sociobot.in/`.
- Why this matters: the demo is presented as a distinct destination but identifies itself as the home page. The sitemap lists only home, privacy, and terms.
- Concrete correction: make `/demo/` a real route with title “Demo — WebMCP Safety Check”, its own canonical and description, and add it to `sitemap.xml`.

#### F-1-4 — Mobile legal and missing-page header targets are smaller than 44×44

- Location: live `/privacy/`, `/terms/`, and an unknown route at 390 px.
- Exact labels: “WebMCP Safety Check” and “public issue tracker”.
- Observed result: the home wordmark link is 40×40 CSS pixels. The privacy issue-tracker link measures 346.8×43.8 CSS pixels.
- Why this matters: the required mobile target baseline is 44×44 CSS pixels, and the current browser suite does not inspect these routes for target size.
- Concrete correction: give the mobile wordmark a minimum 44×44 hit area and ensure the inline issue link reaches 44 px height without disrupting text flow. Extend the mobile target check across home, demo, privacy, terms, and the missing-page route.

### Minor copy and structure findings

#### F-1-5 — The first-screen fact row omits explicit offline and price facts

- Location: home hero.
- Exact copy: “Local only”, “No host permissions”, “Open source”.
- Why this matters: these do not state the tested offline behavior or that the product is free.
- Concrete rewrite: “Free” · “Works offline after the first visit” · “Files stay on your device”.

#### F-1-6 — “Local declaration checker” relies on an undefined technical noun

- Location: home hero label.
- Why this matters: “declaration” is not explained on the first screen.
- Concrete rewrite: “Check what browser tools say they can do”.

#### F-1-7 — The second hero sentence is abstract

- Location: home hero.
- Exact copy: “Classify declared safety properties without running tools or uploading browser content.”
- Why this matters: “declared safety properties” does not tell a new visitor which details the checker shows.
- Concrete rewrite: “See what each tool says it can change, access, and ask you to approve.”

#### F-1-8 — The hero caption is decorative catalog language

- Location: home hero image.
- Exact copy: “Plate 01 · declarations under inspection”.
- Why this matters: the line does not help a visitor use or evaluate the product.
- Concrete rewrite: remove the caption, or use “Illustration of a browser-tool declaration review”.

#### F-1-9 — The three process headings do not make sense out of context

- Location: “How it works”.
- Exact headings and rewrites:
  - “Collect” → “Open a manifest or transcript”.
  - “Identify” → “Review missing and invalid declarations”.
  - “Preserve” → “Export the review or run it in CI”.
- Why this matters: a heading list containing only “Collect”, “Identify”, and “Preserve” does not name the tasks.

#### F-1-10 — “Inspect locally, right now” does not name the section

- Location: inspector section heading.
- Why this matters: a visitor or screen-reader heading list does not learn whether the section accepts a file, shows a report, or explains local use.
- Concrete rewrite: “Inspect a manifest or transcript”.

#### F-1-11 — “Place a specimen here” uses the visual theme instead of the user’s file

- Location: file drop area.
- Why this matters: a first-time visitor must translate “specimen” into a manifest or transcript before knowing what to drop.
- Concrete rewrite: “Drop a manifest or transcript here”.

#### F-1-12 — “No specimens collected” obscures the empty state

- Location: inspector empty-state heading.
- Why this matters: the heading does not state that no tools have been loaded for review.
- Concrete rewrite: “No tools to review”.

#### F-1-13 — “Offline fieldwork” obscures the offline state

- Location: inspector offline notice.
- Why this matters: the theme phrase delays the useful fact that the browser is offline.
- Concrete rewrite: “You are offline.”

#### F-1-14 — The limits section uses a mood label and an abstract heading

- Location: home boundary section.
- Exact copy and rewrites:
  - “Honest boundary” → “What this check cannot confirm”.
  - “An inventory, not a trust verdict.” → “This checks declarations, not tool behavior.”
- Why this matters: the current headings require the following paragraph to explain the section.

#### F-1-15 — The missing-page headings use the field-guide theme instead of naming the error

- Location: live missing route and `site/404.html`.
- Exact copy and rewrites:
  - “Specimen not found” → “Page not found”.
  - “This page is not in the field guide.” → “We could not find this page.”
- Why this matters: a visitor must interpret two theme phrases before learning that the URL is unavailable.

#### F-1-16 — The footer provenance sentence does not help a visitor use the product

- Location: home footer.
- Exact copy: “Generated field-guide imagery has documented project provenance.”
- Why this matters: “documented project provenance” is internal process language and offers no destination where a visitor can confirm it.
- Concrete rewrite: “See how the illustration was made.” Link the sentence to the provenance record, or remove it from the public footer.

#### F-1-17 — Input and product terms change across the landing page and README

- Locations and exact terms: “browser tools”, “browser-tool declarations”, “browser-resident MCP tools”; “JSON/JSONL tools/list transcript”, “MCP tools/list responses”, “transcript arrays”, and “JSONL events”; “mutation/effect” and “effect”.
- Why this matters: a first-time visitor must infer whether these are synonyms or different formats.
- Concrete correction: use “browser tool” for the product object, “declaration” for a value supplied by that tool, and “report” for checker output. Name supported inputs once as “manifest, tools/list response, transcript array, or JSONL transcript”. Replace “mutation/effect” with “effect”. Rewrite the README opening as: “WebMCP Safety Check helps web teams review MCP tools that run in a browser.”

#### F-1-18 — Two action labels do not name their result

- Locations and rewrites:
  - Inspector button “Clear” → “Clear input”.
  - Demo link “Start for real” → “Clear sample and inspect your data”.
- Why this matters: the current labels do not state what changes.

## Demo and sandbox evidence

- Direct demo URL: `/?demo=1#inspector`.
- The first demo load creates a realistic two-tool report with three blocking findings, three warnings, and visible declaration values.
- The demo notice remains in the document during demo interactions.
- **Reset demo** restores the sample after clear.
- **Start for real** returns to `/`, removes the sample and notice, and leaves the input empty.
- A seeded `real:marker=unchanged` local-storage value remained unchanged through demo entry, reset, and exit. Session storage remained empty.
- Live browser traffic during the flow used same-origin GET requests only.
- After first load and service-worker control, the demo reloaded offline and retained a working populated report with no console errors.
- The viewport defect in F-1-1 means the web demo does not satisfy the required first post-click screen.
- The CLI condition in F-1-2 means its demo path is absent.

## Claims check

Every exact command in `.factory/claims.json` was run independently after `npm ci`.

| Claim | Exact check result |
| --- | --- |
| `offline-reload` | PASS, 2 browser projects |
| `download-artifacts` | PASS, 2 browser projects |
| `no-install-cli` | PASS, 2 browser projects |
| `demo-sandbox` | PASS, 2 browser projects; coverage gap recorded in F-1-1 |
| `json-export` | PASS, 2 browser projects |
| `review-card-export` | PASS, 2 browser projects |
| `local-only` | PASS, 2 browser projects |
| `no-tracking-assets` | PASS, 2 browser projects |
| `no-persistence` | PASS, 2 browser projects |
| `extension-no-access` | PASS, 2 browser projects |
| `input-formats` | PASS, targeted unit check |
| `input-size-limit` | PASS, 2 browser projects |
| `cli-policy` | PASS, targeted integration check |
| `classification-policy` | PASS, targeted unit check |
| `declaration-validation` | PASS, targeted unit check |
| `claim-inventory` | PASS, targeted unit check |
| `declaration-sources` | PASS, targeted unit check |
| `unknown-fields` | PASS, targeted unit check |
| `open-source` | PASS, 2 browser projects |
| `free-product` | PASS, 2 browser projects |
| `static-deployment-contract` | PASS, 2 browser projects |
| `asset-provenance` | PASS, targeted unit check |

No additional claim-like sentence lacked a corresponding registry entry. F-1-1 concerns incomplete proof of the existing demo claim, and F-1-2 concerns a required CLI capability that is not currently claimed.

Live download confirmation:

| Artifact | Live result | Local match |
| --- | --- | --- |
| Standalone CLI | 200, `text/javascript`, attachment, 19,631 bytes | SHA-256 `be1178110950b6e2283072f5e26248311735259951f43864534d40d0d0fcea34` matches |
| Chrome extension | 200, `application/zip`, attachment, 309,987 bytes | SHA-256 `669e0565577a840edb0c6a6244bffee42490e2c6f36ec8765dab86eb11366646` matches |

## History confirmation

No earlier `.factory/review-*.md` or `.factory/polish-*.md` file exists. The earlier handoff reports no open defect. Earlier verification findings were also checked rather than assumed fixed.

| Earlier condition | Live and code confirmation |
| --- | --- |
| Product downloads missing or routed to HTML | Fixed; both return 200 with correct types, attachment headers, and exact local hashes. |
| CLI stdin sentinel rejected | Fixed; packed-consumer tests pass. |
| Offline reload lost the inspector | Fixed; live offline reload renders and runs the sample. |
| Hashed assets lacked immutable caching | Fixed; contract check passes. |
| CSP and Permissions-Policy absent | Fixed; live responses include both. |
| Exact claim commands required a prior build | Fixed; each command builds its own production-shaped server and all 22 pass after dependency installation. |
| Invalid declaration values were accepted | Fixed; typed validation check passes and invalid values create blocking findings. |
| Public claims were absent from the registry | Fixed for current public claims; 22 entries and tags are present. |
| Canonical/social/favicon/sitemap/404/footer metadata absent | Fixed for home, privacy, terms, and missing routes; the new demo canonical gap is F-1-3. |
| Two named mobile controls were below 44 px | Fixed for those controls; the newly checked legal-page targets are F-1-4. |
| Development dependency advisories | Fixed; `npm ci` reports zero vulnerabilities. |
| Unknown CLI options were accepted | Fixed; unknown options return exit 2. |
| Demo landmark issue | Fixed; live axe scans report zero violations. |
| Light focus contrast below 3:1 | Fixed; the registered browser check passes. |
| Meaningful text below the 16 px design baseline | Fixed; the registered browser check passes. |

## Structure, routing, accessibility, and visual identity

- `/`, `/privacy/`, and `/terms/` return 200. An unknown path returns the designed document with HTTP 404.
- Route titles follow the required pattern and stay under 60 characters. Each checked document has one h1, one main landmark, language metadata, description, Open Graph image, Twitter card, SVG favicon, and touch icon.
- Home, privacy, and terms canonical URLs are correct. Demo canonical metadata is covered by F-1-3.
- All discovered links return 200 or target a valid in-page ID. Both public repository links return 200. No dead link was found.
- Back navigation restores the prior document and scroll position. Demo entry does not move focus or scroll to the demo, as recorded in F-1-1.
- Desktop light and mobile dark/reduced-motion axe scans report zero violations. The supplied URL check reports no console error, one h1, one main, language metadata, and complete image alt attributes.
- The field-guide palette, serif/monospace pairing, ruled sheets, botanical illustration, status notches, and restrained motion are specific to this product. The visual identity does not resemble a generic centered hero with interchangeable feature cards.
- The standard page order is present: header, first screen, working inspector, three-step explanation, limits, CLI, declaration format, and footer. There is no paid tier.

## Missed leverage

No model-assisted feature is warranted. The core job is deterministic declaration parsing and policy checking, and model output would reduce certainty. Import, JSON/Markdown output, print, extension, and CI paths already exist. The one clearly expected addition is the CLI sample command in F-1-2.

## Copy audit

Word counts include tokens containing a letter or number; standalone symbols do not count. Code blocks are excluded. Standalone labels and headings are included because they must also make sense on first read. No audited sentence exceeds 22 words, and none uses a banned marketing term.

### Landing page: default state

| # | Copy | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Local declaration checker | 3 | F-1-6 |
| 2 | Inspect tool claims before an agent acts. | 7 | — |
| 3 | For web teams deciding whether browser tools are ready for agent use. | 12 | F-1-17 |
| 4 | Classify declared safety properties without running tools or uploading browser content. | 11 | F-1-7 |
| 5 | Loads a sample with missing safety declarations. | 7 | — |
| 6 | Local only | 2 | F-1-5 |
| 7 | No host permissions | 3 | F-1-5 |
| 8 | Open source | 2 | F-1-5 |
| 9 | Plate 01 · declarations under inspection | 5 | F-1-8 |
| 10 | How it works | 3 | — |
| 11 | Review browser-tool declarations in three steps. | 6 | F-1-17 |
| 12 | Collect | 1 | F-1-9 |
| 13 | Open a manifest or a JSON/JSONL tools/list transcript. | 8 | F-1-17 |
| 14 | The file stays on your device. | 6 | — |
| 15 | Identify | 1 | F-1-9 |
| 16 | See explicit claims, invalid values, omissions, risky combinations, and description-only signals per tool. | 13 | F-1-17 |
| 17 | Preserve | 1 | F-1-9 |
| 18 | Export structured JSON or a printable review card; run the same rules in CI. | 14 | F-1-9 |
| 19 | Inspector | 1 | — |
| 20 | Inspect locally, right now. | 4 | F-1-10 |
| 21 | The checker recognizes plain manifests, MCP tools/list responses, transcript arrays, and newline-delimited JSON. | 13 | F-1-17 |
| 22 | Maximum 2 MB. | 3 | — |
| 23 | Manifest inspection workbench | 3 | F-1-17 |
| 24 | Choose a manifest or paste a JSON/JSONL session transcript. | 9 | F-1-17 |
| 25 | The check runs entirely in this browser. | 7 | — |
| 26 | JSON manifests and JSON/JSONL transcripts up to 2 MB. | 9 | F-1-17 |
| 27 | Nothing leaves this device. | 4 | — |
| 28 | Choose a manifest | 3 | — |
| 29 | Ready for a local file or pasted document. | 8 | — |
| 30 | No specimens collected | 3 | F-1-12 |
| 31 | Choose a manifest, drop a transcript, or load the sample to produce a review card. | 15 | — |
| 32 | Claim ≠ proof | 2 | — |
| 33 | Honest boundary | 2 | F-1-14 |
| 34 | An inventory, not a trust verdict. | 6 | F-1-14 |
| 35 | Servers self-declare these properties. | 4 | — |
| 36 | WebMCP Safety Check spots missing and invalid declarations; it does not execute tasks, observe runtime behavior, scrape pages, or certify a vendor. | 22 | — |
| 37 | Use in CI | 3 | — |
| 38 | Fail on missing safety claims. | 5 | — |
| 39 | The standalone Node 20+ CLI exits 1 when required mutation/effect, approval, or before/after evidence declarations are missing. | 17 | F-1-17 |
| 40 | Add stricter claims with a checked-in policy file. | 8 | — |
| 41 | No install required | 3 | — |
| 42 | Optional .webmcp-safety.json | 2 | — |
| 43 | Declaration format | 2 | — |
| 44 | Add safety declarations by hand. | 5 | — |
| 45 | Use x-webmcp-safety, metadata.safety, or standard annotations.readOnlyHint. | 6 | — |
| 46 | Unknown future keys are preserved by your manifest and ignored by the checker. | 13 | — |
| 47 | Free, local-first, and open source. | 5 | F-1-17 |
| 48 | Generated field-guide imagery has documented project provenance. | 7 | F-1-16 |
| 49 | JavaScript is required for local analysis. | 6 | — |
| 50 | The CLI remains available as a download. | 7 | — |

### Landing page: demo and state copy not repeated above

| # | Copy | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Demo — sample data, nothing is saved. | 6 | — |
| 2 | This sample stays in page memory. | 6 | — |
| 3 | Incomplete sample · 2 tools found. | 5 | — |
| 4 | Claims, not proof. | 3 | — |
| 5 | This report checks declarations as claims. | 6 | — |
| 6 | It does not verify server behavior or vendor trustworthiness. | 9 | — |
| 7 | Submit the basket and place an order. | 7 | — |
| 8 | Declare whether this tool reads, mutates, mixes both, or navigates externally. | 11 | — |
| 9 | Declare the approval mode, including none when no approval is expected. | 11 | — |
| 10 | Declare both before and after evidence behavior, including false when unavailable. | 11 | — |
| 11 | Declare whether the tool uses a fresh, real, or selectable browser profile. | 12 | — |
| 12 | Add it to x-webmcp-safety (or metadata.safety). | 6 | — |
| 13 | Declare which origins the tool may reach. | 7 | — |
| 14 | Declare whether and how credentials may be used. | 8 | — |
| 15 | Matched: submit. | 2 | — |
| 16 | This hint does not replace a declaration. | 7 | — |
| 17 | Search public products. | 3 | — |
| 18 | All reviewed claims are present. | 5 | — |
| 19 | Presence is not proof; verify behavior independently. | 7 | — |
| 20 | Offline fieldwork. | 2 | F-1-13 |
| 21 | Analysis and export still work; downloads and documentation links may not. | 11 | — |
| 22 | Nothing to inspect. | 3 | — |
| 23 | Paste JSON or choose a manifest or transcript file. | 9 | — |
| 24 | Valid JSON was found, but no tools were present. | 9 | — |
| 25 | Expected a tools array or a tools/list transcript result. | 9 | F-1-17 |
| 26 | That file is over 2 MB. | 6 | — |
| 27 | Export only the tools/list response or split the transcript, then try again. | 12 | — |
| 28 | The document could not be inspected. | 6 | — |
| 29 | Check that it is valid JSON, then try again. | 9 | — |
| 30 | Choose a local text, JSON, or JSONL file. | 8 | — |
| 31 | No review card yet | 4 | — |
| 32 | Correct the input above, then inspect it again. | 8 | — |
| 33 | Input cleared. | 2 | — |
| 34 | Nothing is stored. | 3 | — |

Dynamic parser details and filenames are appended to clear fixed prefixes; their variable text cannot have a fixed word count.

### README prose and list items

| # | Copy | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | WebMCP Safety Check is a local-first checker for teams reviewing browser-resident MCP tools. | 13 | F-1-17 |
| 2 | It runs as a browser extension, web inspector, and CLI. | 10 | — |
| 3 | It inventories declared safety properties and flags missing claims before an agent can call a tool. | 16 | F-1-17 |
| 4 | It does not execute tools, read browser pages, verify server behavior, or certify a vendor. | 15 | — |
| 5 | Server declarations are claims, not proof. | 6 | — |
| 6 | Live site: https://webmcp-safety-check.sociobot.in | 3 | — |
| 7 | For every discovered tool, the checker records: | 7 | — |
| 8 | read, mutate, mixed, or external-navigation effect; | 6 | — |
| 9 | human approval mode; | 3 | — |
| 10 | before/after evidence behavior; | 3 | — |
| 11 | fresh, real, or selectable browser profile; | 6 | — |
| 12 | allowed origin scope; | 3 | — |
| 13 | credential scope. | 2 | — |
| 14 | The default CI policy fails when effect, approval, or evidence declarations are absent. | 13 | — |
| 15 | Profile, origin, and credential gaps are warnings unless a stricter policy makes them required. | 14 | — |
| 16 | External navigation without origin scope and real-profile use without credential scope are always blockers. | 14 | — |
| 17 | Supported input includes JSON manifests, JSON-RPC tools/list responses, transcript arrays, JSONL events, and single tool objects. | 16 | F-1-17 |
| 18 | The browser UI accepts files up to and including 2 MB. | 11 | — |
| 19 | Requirements: Node.js 20+ and npm. | 5 | — |
| 20 | Both npm run build and the deployment entry point npm run build:site create the complete static release. | 17 | — |
| 21 | They create: | 2 | — |
| 22 | dist/site/index.html — static deployment root; | 4 | — |
| 23 | dist/site/downloads/webmcp-safety-check-chrome.zip — packaged MV3 extension; | 4 | — |
| 24 | dist/site/downloads/webmcp-safety-check.mjs — standalone Node CLI; | 4 | — |
| 25 | dist/cli/webmcp-safety-check.mjs — local CLI artifact; | 4 | — |
| 26 | .output/chrome-mv3/ — unpacked development extension. | 4 | — |
| 27 | The browser suite deletes prior artifacts, runs npm run build:site, then tests desktop and 390 px widths: | 17 | — |
| 28 | Build, then open chrome://extensions in Chrome or Chromium. | 8 | — |
| 29 | Enable Developer mode. | 3 | — |
| 30 | Choose Load unpacked and select .output/chrome-mv3/. | 6 | — |
| 31 | Pin WebMCP Safety Check, open it, and choose or paste a manifest/transcript. | 12 | — |
| 32 | The extension requests no permissions or host access. | 8 | — |
| 33 | It keeps input in page memory only. | 7 | — |
| 34 | Exit codes are stable: 0 passes, 1 means findings meet the policy threshold, and 2 means an input/configuration error. | 19 | — |
| 35 | Markdown is the default output; use --format json for automation. | 10 | — |
| 36 | Place .webmcp-safety.json in the working directory, or pass --policy path: | 10 | — |
| 37 | See .webmcp-safety.example.json and policy.schema.json. | 4 | — |
| 38 | The checker recognizes x-webmcp-safety, metadata.safety, _meta.safety, or annotations.safety. | 8 | — |
| 39 | It also understands MCP annotations.readOnlyHint and a true annotations.destructiveHint for the effect claim. | 13 | — |
| 40 | Explicit false evidence values are valid declarations; omission is the finding. | 11 | — |
| 41 | This format is intentionally a checker contract, not a claim of standards compatibility. | 13 | — |
| 42 | Track specification changes before relying on new fields. | 8 | — |
| 43 | The checker validates the documented values. | 6 | — |
| 44 | Approval accepts required, optional, or none. | 6 | — |
| 45 | Profile accepts fresh, real, or selectable. | 6 | — |
| 46 | Credential scope accepts none, origin-scoped, user-provided, or browser-session. | 8 | — |
| 47 | Origins must be a non-empty array of HTTP or HTTPS origins. | 11 | — |
| 48 | Invalid values block the review instead of counting toward declaration coverage. | 11 | — |
| 49 | There are no analytics, network submissions, CDN scripts, or third-party fonts. | 11 | — |
| 50 | The site service worker precaches the versioned application shell and public examples for offline inspection; it never caches input or reports. | 21 | — |
| 51 | Inputs and reports are not persisted; exports are user-initiated downloads. | 10 | — |
| 52 | site/staticwebapp.config.json serves a designed 404 response, sets immutable caching for fingerprinted assets, and supplies the restrictive CSP and Permissions-Policy. | 19 | — |
| 53 | See the deployed /privacy/ and /terms/ documents. | 7 | — |
| 54 | Generated illustration provenance and the complete visual system are recorded in .factory/design.md. | 12 | — |
| 55 | Product verification and known gaps are in .factory/handoff.md. | 8 | — |
| 56 | Factory workers deploy only the built static root for this product: | 11 | — |
| 57 | After deployment, verify both /downloads/ URLs return attachment responses and compare their SHA-256 hashes with the local artifacts. | 18 | — |
| 58 | No API, database, DNS, or billing configuration belongs in this repository. | 11 | — |
| 59 | MIT — see LICENSE. | 3 | — |

### Actions

The reviewed actions are: **Try it with sample data**, **Download extension**, **Choose file**, **Paste JSON**, **Choose a manifest**, **Inspect declarations**, **Load incomplete sample**, **Clear**, **Undo clear**, **Reset demo**, **Start for real**, **Export report JSON**, **Export review card**, **Print card**, **Download CLI**, **Copy command**, **View a complete example**, and **Open the inspector**. All name a result or destination except the two controls in F-1-18.

## Quality-gate evidence

- `npm ci`: passed; 212 packages and zero reported vulnerabilities.
- `npm test`: 14/14 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; `dist/site` created.
- `npm run test:e2e`: 44/44 passed across desktop and 390 px projects.
- `npm run test:extension`: passed.
- Initial built JavaScript is 20.10 KB raw and 7.32 KB gzip. Initial CSS is 13.55 KB raw and 3.62 KB gzip.
- No console or page error was observed on the live home, demo, privacy, terms, or missing-page route.

## What would make this perfect

Resolve F-1-1 through F-1-18, then repeat the review from new phone and desktop contexts. Per the stated standard, no finding may remain: the first demo screen must visibly show the sample and notice, the CLI must have a clean sample path, route metadata and target sizes must meet the contract, and every flagged line must use one consistent set of plain terms.
