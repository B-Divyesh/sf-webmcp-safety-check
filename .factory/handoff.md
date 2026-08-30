# WebMCP Safety Check — verification handoff

## Result: FAIL

Independent verification of candidate `795d380282f4a4dd839ca8c05a481a0ac1592a0a` at <https://webmcp-safety-check.sociobot.in> completed on 2026-08-30. The detailed evidence is in [verification-2.md](verification-2.md).

## Release blockers

1. Both live product artifacts are unavailable: `/downloads/webmcp-safety-check.mjs` and `/downloads/webmcp-safety-check-chrome.zip` return `404 text/html` with the Azure 404 page. The candidate build contains valid artifacts, so the live deployment is incomplete.
2. After `npm ci` in the clean clone, all five exact commands in `.factory/claims.json` time out because Playwright runs `npm run preview` without first creating `dist/site`. They pass only after a separate `npm run build`.
3. Invalid safety declaration values can receive a clear result. Null approval/profile/origin/credential values produced exit 0, 100% coverage, and “All reviewed claims are present”; separately, actual evidence booleans are replaced with key-presence booleans.
4. Multiple public promises have no dedicated claim registry entries/tests. The download claim test only checks local files and therefore passed while both public downloads were broken.

Other findings: missing sitemap/real 404/social metadata/footer build identity, two sub-44 px mobile targets, 11 development dependency advisories (4 critical), a silently ignored unknown CLI option, and one moderate axe landmark issue.

## Verification passed

- Cold first-read and one-click sample demo gate passed.
- `npm ci`, `npm test` (7/7), `npm run typecheck`, exact `npm run build`, and post-build `npm run test:e2e` (16/16) passed.
- Post-build claim tests passed 2/2 per claim across desktop and 390 px projects.
- Local web inspector, unpacked packaged extension, and clean-consumer CLI handled normal, invalid, boundary, recovery, export, and stdin cases as described in the report.
- Live desktop/mobile and light/dark axe checks had zero serious/critical findings; no console/page errors or horizontal overflow occurred.
- Live request logging showed only the product origin and empty local/session storage. Service-worker update and offline reload succeeded.
- Security headers and immutable hashed-asset caching are present.
- Lighthouse mobile scored 100 in Performance, Accessibility, Best Practices, and SEO; LCP 1.1 s, TBT 70 ms, CLS 0.
- Initial JS, CSS, hero image, and font budgets pass.
- Twenty-one live non-download files match the candidate byte-for-byte.

## How to reproduce

```bash
npm ci
# Each claims.json command fails here because dist/site does not exist.
npm run build
npm test
npm run typecheck
npm run test:e2e

curl -i https://webmcp-safety-check.sociobot.in/downloads/webmcp-safety-check.mjs
curl -i https://webmcp-safety-check.sociobot.in/downloads/webmcp-safety-check-chrome.zip
```

Both curl commands returned 404 during verification. Run every exact claim command from `.factory/claims.json` before and after the production build to reproduce the clean-clone defect.

## Scope and tree state

No product code, deployment, infrastructure, database, shared service, secret, DNS, or billing resource was changed or accessed. Only `.factory/verification-2.md` and this handoff were updated for the independent QA record.
