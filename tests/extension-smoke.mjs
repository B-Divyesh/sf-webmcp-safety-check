import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const packageDirectory = await mkdtemp(join(tmpdir(), 'webmcp-extension-package-'));
const extensionPath = join(packageDirectory, 'extension');
const profile = await mkdtemp(join(tmpdir(), 'webmcp-extension-'));
const errors = [];

try {
  await execFile('unzip', ['-q', resolve('dist/site/downloads/webmcp-safety-check-chrome.zip'), '-d', extensionPath]);
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    const page = await context.newPage();
    await page.goto('chrome://extensions/');
    await page.waitForTimeout(500);
    const extensionId = await page.evaluate(() => {
      const manager = document.querySelector('extensions-manager')?.shadowRoot;
      const list = manager?.querySelector('extensions-item-list')?.shadowRoot;
      return [...(list?.querySelectorAll('extensions-item') ?? [])].find((item) => item.shadowRoot?.querySelector('#name')?.textContent?.includes('WebMCP Safety Check'))?.id;
    });
    if (!extensionId) throw new Error('The unpacked extension was not loaded.');

    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await page.getByRole('tab', { name: 'Paste JSON' }).click();
    await page.getByRole('button', { name: 'Load incomplete sample' }).click();
    await page.getByRole('heading', { name: 'Block exposure' }).waitFor();
    await page.locator('[data-input]').fill('{bad json');
    await page.getByRole('button', { name: 'Inspect declarations' }).click();
    await page.getByRole('alert').waitFor();
    await page.locator('input[type=file]').setInputFiles(resolve('public/examples/safe-manifest.json'));
    await page.getByRole('heading', { name: 'Claims complete' }).waitFor();

    const accessibility = await new AxeBuilder({ page }).analyze();
    if (accessibility.violations.length) throw new Error(`Extension accessibility violations: ${accessibility.violations.map((item) => item.id).join(', ')}`);
    if (errors.length) throw new Error(`Extension console errors: ${errors.join(' | ')}`);
    if (requests.some((url) => !url.startsWith('chrome-extension:'))) throw new Error(`Unexpected extension request: ${requests.join(', ')}`);
    const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
    if (storage.local !== 0 || storage.session !== 0) throw new Error(`Extension persisted browser storage: ${JSON.stringify(storage)}`);

    const manifest = JSON.parse(await readFile(resolve(extensionPath, 'manifest.json'), 'utf8'));
    if ((manifest.permissions?.length ?? 0) || (manifest.host_permissions?.length ?? 0)) throw new Error('Extension requests browser or host permissions.');
    await page.screenshot({ path: '/tmp/webmcp-extension-smoke.png', fullPage: true });
    console.log(`Extension smoke passed for ${extensionId}; axe 0, console 0, external requests 0, storage 0.`);
  } finally {
    await context.close();
  }
} finally {
  await Promise.all([
    rm(profile, { recursive: true, force: true }),
    rm(packageDirectory, { recursive: true, force: true })
  ]);
}
