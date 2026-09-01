# WebMCP Safety Check

WebMCP Safety Check helps web teams review MCP tools that run in a browser. It runs as a browser extension, web inspector, and CLI. It reviews what each browser tool says it can change, access, and ask you to approve.

It does **not** execute tools, read browser pages, verify server behavior, or certify a vendor. Server declarations are claims, not proof.

Live site: <https://webmcp-safety-check.sociobot.in>

## What it checks

For every discovered tool, the checker records:

- read, mutate, mixed, or external-navigation effect;
- human approval mode;
- before/after evidence behavior;
- fresh, real, or selectable browser profile;
- allowed origin scope;
- credential scope.

The default CI policy fails when effect, approval, or evidence declarations are absent. Profile, origin, and credential gaps are warnings unless a stricter policy makes them required. External navigation without origin scope and real-profile use without credential scope are always blockers.

Supported input is a manifest, `tools/list` response, transcript array, JSONL transcript, or single browser tool object. The browser UI accepts files up to and including 2 MB.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev          # WXT extension development
npm run dev:site     # site at http://localhost:5173
npm test
npm run typecheck
npm run build
```

Both `npm run build` and the deployment entry point `npm run build:site` create the complete static release. They create:

- `dist/site/index.html` — static deployment root;
- `dist/site/downloads/webmcp-safety-check-chrome.zip` — packaged MV3 extension;
- `dist/site/downloads/webmcp-safety-check.mjs` — standalone Node CLI;
- `dist/cli/webmcp-safety-check.mjs` — local CLI artifact;
- `.output/chrome-mv3/` — unpacked development extension.

The browser suite deletes prior artifacts, runs `npm run build:site`, then tests desktop and 390 px widths:

```bash
npm run test:e2e
```

## Install the extension

1. Build, then open `chrome://extensions` in Chrome or Chromium.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select `.output/chrome-mv3/`.
4. Pin **WebMCP Safety Check**, open it, and choose or paste a manifest/transcript.

The extension requests no permissions or host access. It keeps input in page memory only.

## Use the CLI in CI

Try the bundled sample without setup:

```bash
node dist/cli/webmcp-safety-check.mjs --demo
```

The command writes its sample manifest and review to a new temporary directory and prints that path. It exits 1 because the sample intentionally has missing declarations.

```bash
node dist/cli/webmcp-safety-check.mjs manifest.json
node dist/cli/webmcp-safety-check.mjs transcript.jsonl --format json --out safety-report.json
cat manifest.json | node dist/cli/webmcp-safety-check.mjs - --strict
```

Exit codes are stable: `0` passes, `1` means findings meet the policy threshold, and `2` means an input/configuration error. Markdown is the default output; use `--format json` for automation.

Place `.webmcp-safety.json` in the working directory, or pass `--policy path`:

```json
{
  "$schema": "https://webmcp-safety-check.sociobot.in/policy.schema.json",
  "requiredClaims": ["effect", "approval", "evidence", "profile", "origins", "credentials"],
  "failOn": "warning"
}
```

See [.webmcp-safety.example.json](.webmcp-safety.example.json) and [policy.schema.json](public/policy.schema.json).

## Declaration format

The checker recognizes `x-webmcp-safety`, `metadata.safety`, `_meta.safety`, or `annotations.safety`. It also understands MCP `annotations.readOnlyHint` and a true `annotations.destructiveHint` for the effect claim.

```json
{
  "name": "save_favorite",
  "description": "Save a product to the signed-in user's favorites.",
  "x-webmcp-safety": {
    "effect": "mutate",
    "approval": "required",
    "evidence": { "before": true, "after": true },
    "profile": "real",
    "origins": ["https://shop.example"],
    "credentials": "origin-scoped"
  }
}
```

Explicit `false` evidence values are valid declarations; omission is the finding. This format is intentionally a checker contract, not a claim of standards compatibility. Track specification changes before relying on new fields.

The checker validates the documented values. Approval accepts `required`, `optional`, or `none`. Profile accepts `fresh`, `real`, or `selectable`. Credential scope accepts `none`, `origin-scoped`, `user-provided`, or `browser-session`. Origins must be a non-empty array of HTTP or HTTPS origins. Invalid values block the review instead of counting toward declaration coverage.

## Privacy, security, and scope

There are no analytics, network submissions, CDN scripts, or third-party fonts. The site service worker precaches the versioned application shell and public examples for offline inspection; it never caches input or reports. Inputs and reports are not persisted; exports are user-initiated downloads. `site/staticwebapp.config.json` serves a designed 404 response, sets immutable caching for fingerprinted assets, and supplies the restrictive CSP and Permissions-Policy. See the deployed `/privacy/` and `/terms/` documents.

Generated illustration provenance and the complete visual system are recorded in [.factory/design.md](.factory/design.md). Product verification and known gaps are in [.factory/handoff.md](.factory/handoff.md).

## Deploy

Factory workers deploy only the built static root for this product:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
/opt/fleet/lib/deploy-static.sh webmcp-safety-check dist/site
```

After deployment, verify both `/downloads/` URLs return attachment responses and compare their SHA-256 hashes with the local artifacts. No API, database, DNS, or billing configuration belongs in this repository.

## License

MIT — see [LICENSE](LICENSE).
