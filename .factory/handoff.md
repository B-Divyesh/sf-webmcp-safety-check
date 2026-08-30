# WebMCP Safety Check — repair handoff

Work order: `webmcp-safety-check-repair-2`  
Base verifier candidate: `23175b5a35efeb85358710f4e2922312435143f2`  
Repair branch base: `7dce439851f12da64c4cc9f9aeea81786b52c55e`

## Reproduced failure

The verifier's exact stdin defect was reproduced from an isolated worktree at the failed candidate. After `npm ci` and `npm run build:cli`, this command:

```bash
cat public/examples/safe-manifest.json | node dist/cli/webmcp-safety-check.mjs - --strict
```

printed `Error: Provide a manifest/transcript path, or - to read stdin...` and exited `2`.

## Repairs

- The CLI parser now treats the literal `-` as its documented stdin source while still excluding option values. `tests/cli.integration.test.ts` builds, packs, installs, and runs the CLI from a clean temporary consumer installation.
- Static deployment configuration excludes `/downloads/*` from navigation fallback, declares `.mjs` and `.zip` MIME types, sends the extension/CLI as attachments, caches hashed assets immutably, and adds restrictive CSP and Permissions-Policy headers.
- The generated service worker now precaches the built fingerprinted JS/CSS shell, versions its cache from the complete shell contents, and only returns the document shell for navigations. Offline module requests now fail safely instead of receiving HTML.
- `/?demo=1#inspector` is a one-click, in-memory sample sandbox. It shows the persistent demo banner, a reset action, and an explicit return to the empty real inspector. No demo or real input uses browser storage.
- `.factory/claims.json`, `.factory/demo.md`, and `.factory/copy-audit.md` record the testable promises, sandbox behavior, and final plain-language audit.

## Verification

Run from a clean checkout with Node 20+:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

Current worker evidence:

- `npm test`: 7/7 passed, including the packed clean-consumer stdin regression.
- `npm run typecheck`: passed.
- `npm run build`: passed; produced `dist/site/`, the 17,187-byte standalone CLI, and the 206,458-byte Chrome zip (`PK` signature).
- `npm run test:e2e`: 16/16 passed across desktop Chromium and the 390 × 844 mobile project. It includes axe serious/critical checks, keyboard tab-arrow interaction, console checks, offline reload, downloads, demo isolation, JSON export, and request-origin privacy coverage.
- Every command in `.factory/claims.json` passed independently on both browser projects.
- `npm audit --omit=dev --audit-level=high`: 0 production vulnerabilities.
- Built MV3 manifest: `permissions: []`, `host_permissions: []`.

## Deployment verification

The static build is ready at `dist/site/`. After deployment, re-run `/opt/fleet/lib/verify-url.sh https://webmcp-safety-check.sociobot.in <evidence-dir>` and check both `/downloads/` artifacts for their content types, content disposition, bytes, and SHA-256 values. Record the live result below before accepting the release.

## Known gaps

- The checker evaluates declarations, not runtime behavior, browser content, task execution, vendor trust, or specification compliance.
- The Chrome extension zip is unsigned; store signing and publishing remain factory responsibilities.
- The format is an intentionally versioned checker contract, not a claimed WebMCP standard.
