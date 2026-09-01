import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

function sha256(contents: Buffer): string {
  return createHash('sha256').update(contents).digest('hex');
}

function parseRgb(color: string): [number, number, number] {
  const values = color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number);
  if (!values || values.length !== 3) throw new Error(`Expected an RGB color, received ${color}`);
  return values as [number, number, number];
}

function relativeLuminance(color: string): number {
  return parseRgb(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  }).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
}

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

test('landing page analyzes an incomplete manifest and remains accessible', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/WebMCP Safety Check/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('img:not([alt])')).toHaveCount(0);

  await page.getByRole('tab', { name: 'Paste JSON' }).click();
  await page.getByRole('button', { name: 'Load incomplete sample' }).click();
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  await expect(page.getByText('Read/mutate effect declaration is missing')).toBeVisible();
  await expect(page.getByText('Human approval declaration is missing')).toBeVisible();
  await expect(page.getByText('Before/after evidence declaration is missing')).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('keyboard tabs and local safe file path produce a clear card', async ({ page }) => {
  await page.goto('/');
  const fileTab = page.getByRole('tab', { name: 'Choose file' });
  await fileTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Paste JSON' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await page.locator('input[type=file]').setInputFiles('public/examples/safe-manifest.json');
  await expect(page.getByRole('heading', { name: 'Claims complete' })).toBeVisible();
  await expect(page.getByText('100%')).toBeVisible();
});

test('privacy and terms each expose a single accessible document heading', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  }
});

test('@claim:offline-reload offline reload keeps the locally cached inspector runnable', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — WebMCP Safety Check');
  await expect(page.getByRole('heading', { name: 'Review sample browser tools' })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // A controller only takes over after the first navigation.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/demo\/$/);
    await expect(page).toHaveTitle('Demo — WebMCP Safety Check');
    await expect(page.getByRole('heading', { name: 'Review sample browser tools' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Inspect tool claims before an agent acts.' })).toHaveCount(0);
    await expect(page.getByLabel('Demo status')).toContainText('Demo — sample data, nothing is saved');
    await expect(page.locator('[data-input]')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:download-artifacts public download URLs serve the exact packaged CLI and extension ZIP', async ({ request }) => {
  const root = resolve(process.cwd(), 'dist/site');
  const sourceExtensionName = (await readdir(resolve('.output'))).find((name) => name.includes('chrome') && name.endsWith('.zip'));
  expect(sourceExtensionName).toBeTruthy();
  const [cliResponse, extensionResponse, config, serviceWorker, packagedCli, packagedExtension, sourceExtension] = await Promise.all([
    request.get('/downloads/webmcp-safety-check.mjs'),
    request.get('/downloads/webmcp-safety-check-chrome.zip'),
    readFile(resolve(root, 'staticwebapp.config.json'), 'utf8'),
    readFile(resolve(root, 'sw.js'), 'utf8'),
    readFile(resolve('dist/cli/webmcp-safety-check.mjs')),
    readFile(resolve(root, 'downloads/webmcp-safety-check-chrome.zip')),
    readFile(resolve('.output', sourceExtensionName!))
  ]);
  const parsed = JSON.parse(config) as {
    responseOverrides: Record<string, { rewrite: string }>;
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };
  const cli = await cliResponse.body();
  const extension = await extensionResponse.body();
  expect(cliResponse.status()).toBe(200);
  expect(cliResponse.headers()['content-type']).toContain('text/javascript');
  expect(cliResponse.headers()['content-disposition']).toContain('attachment');
  expect(extensionResponse.status()).toBe(200);
  expect(extensionResponse.headers()['content-type']).toContain('application/zip');
  expect(extensionResponse.headers()['content-disposition']).toContain('attachment');
  expect(cli).toEqual(packagedCli);
  expect(extension).toEqual(packagedExtension);
  expect(extension).toEqual(sourceExtension);
  expect(sha256(cli)).toBe(sha256(packagedCli));
  expect(sha256(extension)).toBe(sha256(sourceExtension));
  expect(cli.toString('utf8')).toContain('WebMCP Safety Check');
  expect(extension.subarray(0, 2).toString()).toBe('PK');
  expect(extension.byteLength).toBeGreaterThan(1_000);
  expect(parsed.responseOverrides['404']?.rewrite).toBe('/404.html');
  expect(parsed.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(parsed.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(parsed.routes.find((route) => route.route === '/assets/*')?.headers['Cache-Control']).toContain('immutable');
  expect(serviceWorker).not.toContain('"/staticwebapp.config.json"');
});

test('@claim:no-install-cli downloaded CLI runs directly with Node without an install step', async ({ request }) => {
  const response = await request.get('/downloads/webmcp-safety-check.mjs');
  expect(response.status()).toBe(200);
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'webmcp-safety-download-'));
  try {
    const cliPath = join(temporaryDirectory, 'webmcp-safety-check.mjs');
    await writeFile(cliPath, await response.body());
    const { stdout, stderr } = await execFile(process.execPath, [cliPath, resolve('public/examples/safe-manifest.json'), '--format', 'json']);
    expect(stderr).toBe('');
    expect(JSON.parse(stdout)).toMatchObject({ summary: { status: 'clear', blockers: 0 } });
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('@claim:demo-sandbox one landing click opens an isolated, resettable sample in the visible viewport', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('real:marker', 'unchanged'));
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByRole('heading', { name: 'Review sample browser tools' })).toBeFocused();
  await expect(page.getByLabel('Demo status')).toContainText('Demo — sample data, nothing is saved');
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  for (const element of [page.getByLabel('Demo status'), page.getByRole('heading', { name: 'Block exposure' })]) {
    const box = await element.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeLessThan(page.viewportSize()!.height);
  }
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  await expect(page.locator('[data-input]')).toHaveValue(/place_order/);
  expect(await page.evaluate(() => localStorage.getItem('real:marker'))).toBe('unchanged');
  await page.getByRole('link', { name: 'Clear sample and inspect your data' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem('real:marker'))).toBe('unchanged');
  await expect(page.locator('[data-input]')).toHaveValue('');
});

test('@claim:json-export exports the generated report as JSON', async ({ page }) => {
  await page.goto('/?demo=1#inspector');
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export report JSON' }).click();
  const exported = await download;
  expect(exported.suggestedFilename()).toBe('webmcp-safety-report.json');
  const contents = await readFile(await exported.path()!, 'utf8');
  expect(JSON.parse(contents)).toMatchObject({ summary: { status: 'block' } });
});

test('@claim:local-only inspection makes no third-party requests', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http')) origins.add(url.origin);
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Paste JSON' }).click();
  await page.locator('[data-input]').fill(JSON.stringify({ tools: [{ name: 'network_probe', description: 'Fetch https://outside.invalid and execute a tool.', annotations: { readOnlyHint: true }, 'x-webmcp-safety': { approval: 'none', evidence: { before: false, after: false }, profile: 'fresh', origins: ['https://outside.invalid'], credentials: 'none' } }] }));
  await page.getByRole('button', { name: 'Inspect declarations' }).click();
  await expect(page.getByRole('heading', { name: 'Claims complete' })).toBeVisible();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:no-tracking-assets ships no analytics, CDN scripts, or third-party fonts', async ({ page }) => {
  const requests: Array<{ method: string; url: string }> = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.goto('/?demo=1#inspector');
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  expect(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === 'http://127.0.0.1:4173')).toBe(true);
  const assetDirectory = resolve(process.cwd(), 'dist/site/assets');
  const assetNames = await readdir(assetDirectory);
  const textAssets = await Promise.all(assetNames.filter((name) => /\.(?:js|css)$/.test(name)).map((name) => readFile(resolve(assetDirectory, name), 'utf8')));
  const shippedText = [await readFile(resolve(process.cwd(), 'dist/site/index.html'), 'utf8'), ...textAssets].join('\n');
  expect(shippedText).not.toMatch(/google-analytics|googletagmanager|segment\.com|mixpanel|@font-face/i);
});

test('@claim:open-source ships the MIT license and public source link', async ({ page }) => {
  expect(await readFile(resolve(process.cwd(), 'LICENSE'), 'utf8')).toContain('MIT License');
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Source code on GitHub/ })).toHaveAttribute('href', 'https://github.com/B-Divyesh/sf-webmcp-safety-check');
});

test('@claim:free-product the inspector and direct product downloads require neither an account nor payment', async ({ page, request }) => {
  const origins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http')) origins.add(url.origin);
  });
  await page.goto('/?demo=1#inspector');
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  const [cli, extension] = await Promise.all([
    request.get('/downloads/webmcp-safety-check.mjs'),
    request.get('/downloads/webmcp-safety-check-chrome.zip')
  ]);
  expect(cli.status()).toBe(200);
  expect(extension.status()).toBe(200);
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
  const publicCopy = await Promise.all([
    readFile(resolve('site/index.html'), 'utf8'),
    readFile(resolve('site/terms/index.html'), 'utf8')
  ]);
  expect(publicCopy.join('\n')).not.toMatch(/checkout|billing|payment provider|subscribe|sign[ -]?in|log[ -]?in/i);
});

test('@claim:input-size-limit accepts 2 MB and rejects larger browser files', async ({ page }) => {
  await page.goto('/');
  const safe = Buffer.from(JSON.stringify({ tools: [{ name: 'read', description: 'Read.', annotations: { readOnlyHint: true }, 'x-webmcp-safety': { approval: 'none', evidence: { before: false, after: false }, profile: 'fresh', origins: ['https://example.test'], credentials: 'none' } }] }));
  const exact = Buffer.concat([safe, Buffer.alloc(2 * 1024 * 1024 - safe.length, 32)]);
  await page.locator('input[type=file]').setInputFiles({ name: 'exact.json', mimeType: 'application/json', buffer: exact });
  await expect(page.getByRole('heading', { name: 'Claims complete' })).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({ name: 'too-large.json', mimeType: 'application/json', buffer: Buffer.concat([exact, Buffer.from(' ')]) });
  await expect(page.getByRole('alert')).toContainText('over 2 MB');
  await expect(page.getByRole('alert')).toBeFocused();
});

test('@claim:review-card-export downloads Markdown and invokes print', async ({ page }) => {
  await page.goto('/?demo=1#inspector');
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  const markdownDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export review card' }).click();
  const markdown = await markdownDownload;
  expect(markdown.suggestedFilename()).toBe('webmcp-safety-review.md');
  expect(await readFile(await markdown.path()!, 'utf8')).toContain('# WebMCP safety review card');
  await page.evaluate(() => { (window as Window & { printCalled?: boolean }).print = () => { (window as Window & { printCalled?: boolean }).printCalled = true; }; });
  await page.getByRole('button', { name: 'Print card' }).click();
  expect(await page.evaluate(() => (window as Window & { printCalled?: boolean }).printCalled)).toBe(true);
});

test('@claim:no-persistence real input and reports stay out of browser storage and caches', async ({ page }) => {
  const marker = 'private-marker-not-for-storage';
  await page.goto('/');
  await page.getByRole('tab', { name: 'Paste JSON' }).click();
  await page.locator('[data-input]').fill(JSON.stringify({ tools: [{ name: marker, description: 'Read.', annotations: { readOnlyHint: true }, 'x-webmcp-safety': { approval: 'none', evidence: { before: false, after: false }, profile: 'fresh', origins: ['https://example.test'], credentials: 'none' } }] }));
  await page.getByRole('button', { name: 'Inspect declarations' }).click();
  await expect(page.getByRole('heading', { name: marker })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  const persisted = await page.evaluate(async (secret) => {
    const cacheNames = await caches.keys();
    const cacheText = (await Promise.all(cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      const responses = await Promise.all((await cache.keys()).map(async (request) => `${request.url}\n${await (await cache.match(request))?.text()}`));
      return responses.join('\n');
    }))).join('\n');
    return { local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage), cacheContainsMarker: cacheText.includes(secret) };
  }, marker);
  expect(persisted).toEqual({ local: '{}', session: '{}', cacheContainsMarker: false });
});

test('@claim:extension-no-access package declares no browser or host permissions', async () => {
  const manifest = JSON.parse(await readFile(resolve(process.cwd(), '.output/chrome-mv3/manifest.json'), 'utf8')) as { manifest_version: number; permissions?: string[]; host_permissions?: string[] };
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.permissions ?? []).toEqual([]);
  expect(manifest.host_permissions ?? []).toEqual([]);
});

test('metadata, discovery, footer identity, and real 404 are complete', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://webmcp-safety-check.sociobot.in/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-card\.webp$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  await expect(page.getByText('Built by Param Factory · v1.0.1')).toBeVisible();
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('/privacy/');
  expect(await sitemap.text()).toContain('/demo/');
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — WebMCP Safety Check');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://webmcp-safety-check.sociobot.in/demo/');
  await page.goto('/?demo=1');
  await expect(page).toHaveURL(/\/demo\/$/);
  const missing = await request.get('/not-a-real-route');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('We could not find this page.');
});

test('light-theme focus rings meet 3:1 contrast on every light surface and inside the terminal', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const privacyLink = page.getByRole('link', { name: 'Privacy' }).first();
  await privacyLink.focus();
  const lightFocus = await privacyLink.evaluate((element) => {
    const resolveToken = (token: string): string => {
      const sample = document.createElement('span');
      sample.style.color = `var(${token})`;
      document.body.append(sample);
      const value = getComputedStyle(sample).color;
      sample.remove();
      return value;
    };
    return {
      outline: getComputedStyle(element).outlineColor,
      focus: resolveToken('--focus'),
      paper: resolveToken('--paper'),
      paperDeep: resolveToken('--paper-deep'),
      sheet: resolveToken('--sheet')
    };
  });
  expect(lightFocus.outline).toBe(lightFocus.focus);
  for (const surface of [lightFocus.paper, lightFocus.paperDeep, lightFocus.sheet]) {
    expect(contrastRatio(lightFocus.outline, surface)).toBeGreaterThanOrEqual(3);
  }

  const terminalCopy = page.getByRole('button', { name: 'Copy command' });
  await terminalCopy.focus();
  const terminalFocus = await terminalCopy.evaluate((element) => ({
    outline: getComputedStyle(element).outlineColor,
    background: getComputedStyle(element.closest('.terminal')!).backgroundColor
  }));
  expect(contrastRatio(terminalFocus.outline, terminalFocus.background)).toBeGreaterThanOrEqual(3);
});

test('meaningful landing, inspector, legal, and mobile copy keeps the 16 px baseline', async ({ page }) => {
  const selectors = [
    '.hero__action-note', '.micro-proof', '.site-footer p', '.site-footer nav span', '.terminal pre', '.format pre'
  ];
  await page.goto('/');
  for (const selector of selectors) {
    const sizes = await page.locator(selector).evaluateAll((elements) => elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)));
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.every((size) => size >= 16)).toBe(true);
  }
  await page.goto('/demo/');
  for (const selector of ['.report__eyebrow', '.coverage span', '.summary-list span', '.claim-tag', '.finding p']) {
    const sizes = await page.locator(selector).evaluateAll((elements) => elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)));
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.every((size) => size >= 16)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const selector of ['.hero__action-note', '.micro-proof', '.terminal pre', '.format pre', '.site-footer p', '.site-footer nav span']) {
    const sizes = await page.locator(selector).evaluateAll((elements) => elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)));
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.every((size) => size >= 16)).toBe(true);
  }
  await page.goto('/privacy/');
  expect(Number.parseFloat(await page.locator('.eyebrow').evaluate((element) => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  expect(Number.parseFloat(await page.locator('.legal-footer').evaluate((element) => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
});

test('all demo axe rules pass and mobile targets meet 44 CSS pixels on every reviewed route', async ({ page }) => {
  await page.goto('/demo/');
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.goto('/');
  for (const element of [page.getByRole('button', { name: 'Copy command' }), page.getByRole('link', { name: /View a complete example/ })]) {
    const box = await element.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/demo/', '/privacy/', '/terms/', '/not-a-real-route']) {
    await page.goto(route);
    const wordmark = page.getByRole('link', { name: 'WebMCP Safety Check home' }).or(page.locator('.site-header .brand')).first();
    const box = await wordmark.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  for (const route of ['/', '/demo/']) {
    await page.goto(route);
    const provenance = page.getByRole('link', { name: 'See how the illustration was made.' });
    const box = await provenance.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/privacy/');
  const issue = page.getByRole('link', { name: 'Public issue tracker on GitHub (external site)' });
  expect((await issue.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

test('keyboard entry, dark mode, and reduced motion remain accessible', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.querySelector('main')?.contains(document.activeElement))).toBe(true);

  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/?demo=1#inspector');
  const motion = await page.locator('.report').evaluate((element) => ({
    animation: getComputedStyle(element).animationDuration,
    scroll: getComputedStyle(document.documentElement).scrollBehavior
  }));
  expect(Number.parseFloat(motion.animation)).toBeLessThanOrEqual(0.01);
  expect(motion.scroll).toBe('auto');
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('@claim:static-deployment-contract static routes send security headers, cache immutable assets, and return a designed 404', async ({ page, request }) => {
  const home = await request.get('/');
  expect(home.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(home.headers()['permissions-policy']).toContain('camera=()');
  expect(home.headers()['x-content-type-options']).toBe('nosniff');
  const scriptPath = (await home.text()).match(/src="(\/assets\/(?:index|main)-[^"]+\.js)"/)?.[1];
  expect(scriptPath).toBeTruthy();
  expect((await request.get(scriptPath!)).headers()['cache-control']).toContain('immutable');
  expect((await request.get('/sw.js')).headers()['cache-control']).toBe('no-cache');
  const missing = await request.get('/not-a-real-route');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('We could not find this page.');

  for (const route of ['/privacy/', '/terms/']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', new RegExp(`${route.replaceAll('/', '\\/')}$`));
    await expect(page.getByText(/Built by Param Factory · v1\.0\.1/)).toBeVisible();
  }
});
