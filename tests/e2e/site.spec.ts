import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
