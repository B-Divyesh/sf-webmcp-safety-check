import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

await mkdir(new URL('../dist/cli', import.meta.url), { recursive: true });
await build({
  entryPoints: [new URL('../src/cli.ts', import.meta.url).pathname],
  outfile: new URL('../dist/cli/webmcp-safety-check.mjs', import.meta.url).pathname,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none'
});
