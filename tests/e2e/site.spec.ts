import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
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

test('offline reload keeps the locally cached inspector runnable', async ({ page, context }) => {
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
  }
});

test('release configuration preserves real downloadable artifacts and static hardening', async () => {
  const root = resolve(process.cwd(), 'dist/site');
  const [cli, extension, config] = await Promise.all([
    readFile(resolve(root, 'downloads/webmcp-safety-check.mjs'), 'utf8'),
    readFile(resolve(root, 'downloads/webmcp-safety-check-chrome.zip')),
    readFile(resolve(root, 'staticwebapp.config.json'), 'utf8')
  ]);
  const parsed = JSON.parse(config) as {
    navigationFallback: { exclude: string[] };
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };
  expect(cli).toContain('WebMCP Safety Check');
  expect(extension.subarray(0, 2).toString()).toBe('PK');
  expect((await stat(resolve(root, 'downloads/webmcp-safety-check-chrome.zip'))).size).toBeGreaterThan(1_000);
  expect(parsed.navigationFallback.exclude).toContain('/downloads/*');
  expect(parsed.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(parsed.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(parsed.routes.find((route) => route.route === '/assets/*')?.headers['Cache-Control']).toContain('immutable');
});
