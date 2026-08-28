# Independent product verification — FAIL

Verified at: `2026-08-28T02:31:19Z`  
Candidate: `23175b5a35efeb85358710f4e2922312435143f2` (`main`)  
Live URL: <https://webmcp-safety-check.sociobot.in>  
Work order: `webmcp-safety-check-verify-1`

## Verdict

**FAIL.** The production download calls to action do not deliver either required product artifact, and the documented CLI stdin API is broken in a clean consumer install. The browser extension popup and the file-path CLI mode do work, but these failures prevent acceptance of the browser-extension plus CLI product.

## Release-blocking defects

### P0 — Live extension and CLI downloads return the homepage, not artifacts

The candidate builds the artifacts correctly, but the live deployment does not serve them:

| URL | Live response | Expected built artifact |
| --- | --- | --- |
| `/downloads/webmcp-safety-check.mjs` | `200 text/html`, 7,349 bytes, SHA-256 `f5de20509e10b99a8b374efa64734f648859dccce6334a3e50c91fa1aac0a19d` — exactly the homepage | `dist/site/downloads/webmcp-safety-check.mjs`, 16,891 bytes, SHA-256 `69ea3090f40a06b6c122950c0dde8bf80d903aeed5511235dc04dba10c762036` |
| `/downloads/webmcp-safety-check-chrome.zip` | `200 text/html`, 7,349 bytes, same homepage SHA-256 | `dist/site/downloads/webmcp-safety-check-chrome.zip`, 205,855 bytes, SHA-256 `15d5e43ba38fed2088e1985a2a934a5665b5b38ba7fa499c723510b2713c504b` |

Both links are primary public CTAs and are required to obtain the advertised extension/CLI. This is a deployment routing/static-asset failure: the homepage, hashed JS/CSS, service worker, examples, legal pages, and hero assets match the candidate, but both nested download artifacts are rewritten to the homepage.

Reproduction:

```bash
curl -sS -D - -o /dev/null \
  https://webmcp-safety-check.sociobot.in/downloads/webmcp-safety-check.mjs
curl -sS -D - -o /dev/null \
  https://webmcp-safety-check.sociobot.in/downloads/webmcp-safety-check-chrome.zip
```

Both return `content-type: text/html` and `content-length: 7349`.

### P1 — Documented stdin CLI mode always rejects `-`

README documents this supported CI command:

```bash
cat manifest.json | node dist/cli/webmcp-safety-check.mjs - --strict
```

In a clean `npm pack` consumer installation, it exits `2` before reading stdin:

```text
Error: Provide a manifest/transcript path, or - to read stdin. Run with --help for usage.
```

The command-line positional parser excludes every argument that starts with `-`, including the documented stdin sentinel. File input is otherwise functional (`safe-manifest.json`: exit `0`, `clear:100`; `incomplete-manifest.json`: exit `1`, `block:5`). This breaks the promised stdin CI interface.

## Other defects

### P2 — Offline reload leaves the site without an inspector

After a fresh online visit to the built site, waiting for an active service-worker controller, setting Chromium offline, and reloading at 390 × 844:

- the document shell loads, but `[data-input]` count is `0`;
- Chrome emits `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"`;
- the checker cannot run.

`public/sw.js` precaches only selected documents/assets, not the Vite JS/CSS entry assets. Its catch fallback returns `/` for a failed module request, which supplies HTML to a module loader. This contradicts the UI’s “Offline fieldwork. Analysis and export still work” claim. The cache name is also fixed at `webmcp-safety-check-v1`, rather than being build-versioned.

### P2 — Live hashed assets are not immutable-cached

The live HTML, JS, service worker, and downloads all respond with `cache-control: public, must-revalidate, max-age=30`. The hashed `assets/index-CGULEZ-a.js` response is therefore not long-lived or `immutable`, contrary to the static-product caching policy. This is not the cause of the download failure, but should be corrected in deployment configuration.

### P3 — Response-policy hardening is incomplete

Live responses include HSTS, `nosniff`, strict referrer policy, and DNS-prefetch disablement, but no `Content-Security-Policy` or `Permissions-Policy` header was present. Add restrictive policies appropriate for this static, local-first product.

## Verification passed

### Clean install and build

Executed from a clean checkout at the candidate SHA:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
```

- `npm test`: 6/6 Vitest tests passed.
- `npm run typecheck`: passed.
- Exact `npm run build`: passed; produced the MV3 extension, CLI, static site, and extension zip.
- `npm run test:e2e`: 6/6 Playwright tests passed on desktop Chromium and a 390 × 844 mobile viewport.
- `npm audit --omit=dev --audit-level=high`: zero production vulnerabilities. (`npm ci` reported 11 development dependency advisories.)

### Product behavior

- Local inspector: a normal JSON-RPC `tools/list` transcript with complete declarations produced “Claims complete”; an incomplete sample produced the three required missing-declaration blockers.
- Invalid JSON focuses a clear alert; a subsequent valid input recovers successfully.
- A 2 MiB + 1 byte local file is rejected with the documented size error; clearing and Undo restore input; JSON report export downloads.
- Cleanly loaded unpacked MV3 extension: manifest has `permissions: []` and `host_permissions: []`; popup returned three blockers for the incomplete sample and “Claims complete” for the declared tool; no console/page errors and no network origin beyond the extension itself.
- A packed clean consumer installed successfully. The CLI handles normal files and correct policy exit codes; only stdin mode fails as described above.

### Accessibility, responsiveness, privacy, and performance

- Fresh live desktop and 390 px mobile checks: one `h1`, one `main`, correct title/lang, no horizontal overflow, no page/console errors, and no outbound requests beyond `https://webmcp-safety-check.sociobot.in` during load and inspection.
- Axe on live desktop and mobile: zero serious/critical findings. Keyboard Tab reaches the skip link with a visible 3 px outline; Arrow-key tabs are covered by the repository e2e suite.
- With reduced motion enabled, the report animation duration is `0.01s`; no looping animation observed.
- Lighthouse 12.8.2 local mobile report: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.36 s, CLS 0, TBT 46 ms. Lighthouse printed a post-run Chromium tab-crash diagnostic but exited successfully and wrote the complete JSON report; the result should be rerun after deployment configuration changes.
- Built static main JS is 18,360 bytes (6,720 bytes gzip per Vite), main CSS is 12,824 bytes (3,530 bytes gzip), mobile hero is 32,920 bytes, and no web fonts are shipped: all are within the stated budgets.
- Browser traffic and source review found no analytics, uploads, browser-content collection, CDN fonts, or third-party runtime scripts. Inputs/reports remain in memory unless the user explicitly exports them.

### Live identity comparison

The live homepage exactly matches `dist/site/index.html` (SHA-256 `f5de20509e10b99a8b374efa64734f648859dccce6334a3e50c91fa1aac0a19d`). The live hashed main JS, CSS, and service worker also match the candidate byte-for-byte. Privacy, terms, examples, schema, logo, and hero files are served with their expected types. Only the two required nested `/downloads/` artifacts fail identity/content checks.

## Required remediation and re-verification

1. Configure deployment to serve `dist/site/downloads/webmcp-safety-check.mjs` and `webmcp-safety-check-chrome.zip` as static files without SPA fallback, with correct MIME/content disposition for the CLI/zip.
2. Fix CLI parsing so literal `-` is accepted as the stdin source; add a clean-consumer stdin test matching the README command.
3. Precache the current hashed JS/CSS shell (or avoid returning `/` for asset failures), version the service-worker cache per build, and prove offline reload retains a functional inspector.
4. Set immutable caching for hashed assets and add CSP/Permissions-Policy headers.
5. Re-run this verification against a new candidate and live deployment.
