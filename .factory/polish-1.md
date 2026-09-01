# Polish round 1 — WebMCP Safety Check

Candidate repaired from `69e5ea756c3a75799d39049cba0701ec360c46da` in product repair commit `1d8590135be236c3d4958f57262ecae7624f32b5`. Deployment `d9e55376-31b5-4468-ab16-04469031787a` was cold-checked at <https://webmcp-safety-check.sociobot.in> on 2026-09-01. Live evidence is in `.factory/evidence/live-demo/`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Added a real `/demo/` page. The landing action enters it, focuses its h1, retains the banner, and hides setup controls so the populated report is in the first viewport. `?demo=1` redirects to the same isolated route. | `@claim:demo-sandbox`; `.factory/evidence/live-demo/after-click-desktop.png`; `.factory/evidence/live-demo/after-click-mobile.png`; live `/demo/` and `/?demo=1` checks in `cold-check.json` |
| F-1-2 | Added CLI `--demo`: it embeds a realistic incomplete manifest, writes the manifest and review to a new temporary directory, prints the paths, and preserves the policy exit code. | `@claim:cli-demo` |
| F-1-3 | Added `/demo/` title, description, canonical, social metadata, and sitemap entry. | `metadata, discovery, footer identity, and real 404 are complete`; live `/demo/` in `cold-check.json` |
| F-1-4 | Legal wordmarks now have 44 px hit areas; the issue-tracker link is a 44 px inline target. Added route-wide mobile size coverage. | `all demo axe rules pass and mobile targets meet 44 CSS pixels on every reviewed route`; live target measurements in `cold-check.json` |
| F-1-5 | Replaced hero facts with Free, Works offline after the first visit, and Files stay on your device. | `.factory/copy-audit.md`; `@claim:offline-reload`; `@claim:free-product` |
| F-1-6 | Rewrote the first eyebrow as “Check what browser tools say they can do.” | `.factory/copy-audit.md` |
| F-1-7 | Rewrote the hero explanation to name changes, access, and approval. | `.factory/copy-audit.md` |
| F-1-8 | Replaced the decorative caption with a plain illustration description. | `.factory/copy-audit.md` |
| F-1-9 | Replaced process labels with task headings that stand alone. | `.factory/copy-audit.md` |
| F-1-10 | Renamed the inspector heading to “Inspect a manifest or transcript.” | `.factory/copy-audit.md` |
| F-1-11 | Renamed the drop prompt to “Drop a manifest or transcript here.” | `.factory/copy-audit.md` |
| F-1-12 | Renamed the empty state to “No tools to review.” | `.factory/copy-audit.md` |
| F-1-13 | Renamed the offline state to “You are offline.” | `.factory/copy-audit.md`; `@claim:offline-reload` |
| F-1-14 | Rewrote the limits labels to “What this check cannot confirm” and “This checks declarations, not tool behavior.” | `.factory/copy-audit.md` |
| F-1-15 | Rewrote the designed 404 as “Page not found” / “We could not find this page.” | `@claim:static-deployment-contract`; `metadata, discovery, footer identity, and real 404 are complete`; live `/missing-page` in `cold-check.json` |
| F-1-16 | Replaced internal provenance wording with a public link to the documented design record. | `@claim:asset-provenance`; `.factory/copy-audit.md` |
| F-1-17 | Standardized browser tool, declaration, report, effect, and supported-input wording across landing, demo, and README. | `.factory/copy-audit.md`; `@claim:input-formats`; `@claim:claim-inventory` |
| F-1-18 | Renamed Clear to Clear input and Start for real to Clear sample and inspect your data. | `@claim:demo-sandbox`; `.factory/copy-audit.md` |

Earlier review items were re-run rather than assumed fixed: the full browser suite covers offline reload, downloads, headers, 404, metadata, no persistence, extension permissions, exports, input bounds, keyboard behavior, axe, mobile layout, and reduced motion. The live demo also reloaded offline under service-worker control with a populated report and zero console errors; the public CLI and ZIP are byte-identical to `dist/site`.
