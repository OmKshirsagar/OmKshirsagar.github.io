import { test, expect } from '@playwright/test';

test('homepage renders name and role from YAML', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Kshirsagar');
  await expect(page.locator('body')).toContainText('Analyst');
  await expect(page.locator('body')).toContainText('Deloitte');
  await expect(page.locator('body')).toContainText('PROMOTED');
});

test('journey route renders placeholder', async ({ page }) => {
  await page.goto('/journey');
  await expect(page.locator('h1')).toContainText('cinematic');
});

test('cross-link from home to journey works', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/journey"]');
  await expect(page).toHaveURL(/\/journey/);
});
