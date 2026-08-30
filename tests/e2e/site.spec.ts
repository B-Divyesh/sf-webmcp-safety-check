import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

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
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // A controller only takes over after the first navigation.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-input]')).toHaveCount(1);
    await page.getByRole('tab', { name: 'Paste JSON' }).click();
    await page.getByRole('button', { name: 'Load incomplete sample' }).click();
    await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:download-artifacts served download URLs return the CLI and extension packages', async ({ request }) => {
  const root = resolve(process.cwd(), 'dist/site');
  const [cliResponse, extensionResponse, config, serviceWorker] = await Promise.all([
    request.get('/downloads/webmcp-safety-check.mjs'),
    request.get('/downloads/webmcp-safety-check-chrome.zip'),
    readFile(resolve(root, 'staticwebapp.config.json'), 'utf8'),
    readFile(resolve(root, 'sw.js'), 'utf8')
  ]);
  const parsed = JSON.parse(config) as {
    responseOverrides: Record<string, { rewrite: string }>;
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };
  const cli = await cliResponse.text();
  const extension = await extensionResponse.body();
  expect(cliResponse.status()).toBe(200);
  expect(cliResponse.headers()['content-type']).toContain('text/javascript');
  expect(cliResponse.headers()['content-disposition']).toContain('attachment');
  expect(extensionResponse.status()).toBe(200);
  expect(extensionResponse.headers()['content-type']).toContain('application/zip');
  expect(extensionResponse.headers()['content-disposition']).toContain('attachment');
  expect(cli).toContain('WebMCP Safety Check');
  expect(extension.subarray(0, 2).toString()).toBe('PK');
  expect(extension.byteLength).toBeGreaterThan(1_000);
  expect(parsed.responseOverrides['404']?.rewrite).toBe('/404.html');
  expect(parsed.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(parsed.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(parsed.routes.find((route) => route.route === '/assets/*')?.headers['Cache-Control']).toContain('immutable');
  expect(serviceWorker).not.toContain('"/staticwebapp.config.json"');
});

test('@claim:demo-sandbox demo loads a resettable sample without persisted data', async ({ page }) => {
  await page.goto('/?demo=1#inspector');
  await expect(page.getByLabel('Demo status')).toContainText('Demo — sample data, nothing is saved');
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'Block exposure' })).toBeVisible();
  await expect(page.locator('[data-input]')).toHaveValue(/place_order/);
  const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
  expect(storage).toEqual({ local: 0, session: 0 });
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
  const missing = await request.get('/not-a-real-route');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('This page is not in the field guide.');
});

test('all demo axe rules pass and mobile targets meet 44 CSS pixels', async ({ page }) => {
  await page.goto('/?demo=1#inspector');
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  for (const element of [page.getByRole('button', { name: 'Copy command' }), page.getByRole('link', { name: /View a complete example/ })]) {
    const box = await element.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
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

test('response policies and route metadata match the static deployment contract', async ({ page, request }) => {
  const home = await request.get('/');
  expect(home.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(home.headers()['permissions-policy']).toContain('camera=()');
  expect(home.headers()['x-content-type-options']).toBe('nosniff');
  const scriptPath = (await home.text()).match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
  expect(scriptPath).toBeTruthy();
  expect((await request.get(scriptPath!)).headers()['cache-control']).toContain('immutable');
  expect((await request.get('/sw.js')).headers()['cache-control']).toBe('no-cache');

  for (const route of ['/privacy/', '/terms/']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', new RegExp(`${route.replaceAll('/', '\\/')}$`));
    await expect(page.getByText(/Built by Param Factory · v1\.0\.1/)).toBeVisible();
  }
});
