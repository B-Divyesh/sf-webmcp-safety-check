# WebMCP Safety Check — review 1 handoff

## Result: FAIL

Critical first-read QA was completed against commit `69e5ea756c3a75799d39049cba0701ec360c46da` and the live site on 2026-09-01. Product code was not changed.

The first screen explains the job, audience, primary action, and expected sample. The live downloads match the local build, all 22 registered claim commands pass, the full test and build gates pass, offline use works, and recorded browser requests stay on the product origin.

Two blocking demo findings remain:

- Selecting **Try it with sample data** changes the URL and loads the sample, but both phone and desktop viewports remain on the landing headline. The demo notice and populated review are far below the viewport.
- The shipped standalone CLI has no `--demo` or `demo` command that runs bundled sample data from a new temporary directory.

The review also records route metadata, touch-target, first-screen fact, copy, terminology, control-label, and 404 copy findings. Full evidence and proposed corrections are in `.factory/review-1.md`.

## Verification performed

- All 22 exact commands from `.factory/claims.json`: passed.
- `npm test`: 14/14 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed and produced `dist/site`.
- `npm run test:e2e`: 44/44 passed.
- `npm run test:extension`: passed; axe 0, console 0, external requests 0, storage 0.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200, 651 ms load, one h1, one main, language/title/alt checks passed, console errors 0.
- Live axe checks: zero violations on desktop light and mobile dark/reduced-motion.
- Live offline demo reload: passed with a controlling service worker and no console errors.
- Live request log: same-origin GET requests only.
- Live CLI and extension downloads: HTTP 200 with attachment headers and byte-for-byte local matches.

## Reproduce

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run test:extension
```

Open the live home page at 390×844, select **Try it with sample data**, and capture the viewport. The URL becomes `/?demo=1#inspector`, but the viewport remains at the hero while `#inspector`, the demo notice, and `#report-title` begin well below it.

## Next steps

Correct every finding in `.factory/review-1.md`, add regression coverage for the landing-to-demo viewport and focus result, provide a CLI sample command, then repeat the entire review from a fresh context.
