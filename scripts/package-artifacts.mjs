import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('.output');
const downloads = resolve('dist/site/downloads');
await mkdir(downloads, { recursive: true });
const zip = (await readdir(output)).find((name) => name.endsWith('.zip') && name.includes('chrome'));
if (!zip) throw new Error('WXT did not produce a Chrome extension zip.');
await copyFile(resolve(output, zip), resolve(downloads, 'webmcp-safety-check-chrome.zip'));
await copyFile(resolve('dist/cli/webmcp-safety-check.mjs'), resolve(downloads, 'webmcp-safety-check.mjs'));
