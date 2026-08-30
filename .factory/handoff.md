# WebMCP Safety Check — repair handoff

Work order: `webmcp-safety-check-repair-2`  
Base verifier candidate: `23175b5a35efeb85358710f4e2922312435143f2`  
Repair commits before this handoff update: `7dce439851f12da64c4cc9f9aeea81786b52c55e`, `3347f9e4f8b31d953a17d5eb71cc93ac9c43c2de`, `baf2700d8b283611e18a3b8ed06d0bab33a8fa95`, and `5d38f4e18886a82309ec60b2367e3ef4d92f15b6`.

## Reproduced failure

The verifier's exact stdin defect was reproduced from an isolated worktree at the failed candidate. After `npm ci` and `npm run build:cli`, this command:

```bash
cat public/examples/safe-manifest.json | node dist/cli/webmcp-safety-check.mjs - --strict
```

printed `Error: Provide a manifest/transcript path, or - to read stdin...` and exited `2`.

## Repairs

- The CLI parser now treats the literal `-` as its documented stdin source while still excluding option values. `tests/cli.integration.test.ts` builds, packs, installs, and runs the CLI from a clean temporary consumer installation.
- Static deployment configuration excludes `/downloads/*` from navigation fallback, declares `.mjs` and `.zip` MIME types, sends the extension/CLI as attachments, caches hashed assets immutably, and adds restrictive CSP and Permissions-Policy headers.
- The generated service worker now precaches the built fingerprinted JS/CSS shell, versions its cache from the complete shell contents, and only returns the document shell for navigations. It registers whether the module initializes before or after `load`, and it excludes Azure's deployment-only `staticwebapp.config.json`, whose 404 would otherwise reject `cache.addAll` and discard the worker.
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

The built `dist/site/` was deployed to the existing `sf-webmcp-safety-check` Static Web App on 2026-08-30. No shared DNS, database, Key Vault, or unrelated service was read or changed.

- `/opt/fleet/lib/verify-url.sh https://webmcp-safety-check.sociobot.in …`: HTTPS 200; 828 ms desktop load; title, `lang`, exactly one `h1`, `main`, and image-alt checks passed; no page or console errors.
- Live desktop and 390 × 844 mobile demo checks: the sample report rendered; axe had 0 serious/critical violations; no console errors. The mobile offline reload had one input, analyzed the shipped sample, and used cache `webmcp-safety-check-75ec3ba38a9ef2cd`.
- Keyboard smoke check: first Tab focused **Skip to main content** with a solid visible outline.
- Live CLI: `text/javascript`, `attachment`, 17,187 bytes, SHA-256 `ba021f64c7d1a3cbb065eb62d81a339c168f425e13296535dda0b725bc95da20`, exactly matching `dist/site/downloads/webmcp-safety-check.mjs`.
- Live extension zip: `application/zip`, `attachment`, 206,458 bytes, SHA-256 `06cad0b90baaed810cf233b1f5028d8a7266b697a69e447932e8b31ee2c1dfd1`, exactly matching `dist/site/downloads/webmcp-safety-check-chrome.zip`.
- Live hashed JavaScript: `Cache-Control: public, max-age=31536000, immutable`. The landing response includes the restrictive CSP, Permissions-Policy, strict referrer policy, and `nosniff`.

## Known gaps

- The checker evaluates declarations, not runtime behavior, browser content, task execution, vendor trust, or specification compliance.
- The Chrome extension zip is unsigned; store signing and publishing remain factory responsibilities.
- The format is an intentionally versioned checker contract, not a claimed WebMCP standard.
