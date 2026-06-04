import { test, expect } from '@playwright/test';

test('homepage renders name and role from YAML', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Kshirsagar');
  await expect(page.locator('body')).toContainText('Software Engineer I');
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

test('hero shows stats row with 6 tiles', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.stat')).toHaveCount(6);
});

test('featured section has 3 bands', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.feat-band')).toHaveCount(3);
});

test('career arc shows 5 cells', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.strip .cell')).toHaveCount(5);
});

test('recognized section renders cards', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('section#recognized .card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  // 2 awards + 1 promotion + 1 publication = 4 cards (cert placeholder removed)
  expect(count).toBeGreaterThanOrEqual(4);
});

test('work timeline has 5 engagement groups', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.engagement')).toHaveCount(5);
});

test('bottom nav pill renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.bnav')).toBeVisible();
});

test('footer has get-in-touch heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer.footer')).toContainText(/in touch/i);
});

test('footer meta-bar shows copyright and view-source link', async ({ page }) => {
  await page.goto('/');
  const meta = page.locator('footer.footer .meta-bar');
  await expect(meta).toBeVisible();
  await expect(meta).toContainText(/Om Kshirsagar/);
  await expect(meta.locator('a.meta-link')).toHaveAttribute(
    'href',
    /github\.com\/OmKshirsagar/
  );
});

test('Read-more buttons open the case-study modal', async ({ page }) => {
  await page.goto('/');
  // 3 Read-more buttons (one per featured band)
  const buttons = page.locator('button.more[data-case-slug]');
  await expect(buttons).toHaveCount(3);

  // Click the Voice Assistant (slug=healthcare-voice-assistant) — band 01
  await buttons.first().click();

  // Modal appears, with proper title + sections
  const modal = page.locator('.cs-backdrop .cs-panel');
  await expect(modal).toBeVisible();
  await expect(modal.locator('h2.cs-title')).toContainText(
    /Voice Assistant/i
  );
  // Architecture diagram rendered
  await expect(modal.locator('.arch-wrap svg')).toBeVisible();
  // ESC closes
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
});

test('case-study modal opens for each of the 3 featured projects', async ({
  page,
}) => {
  await page.goto('/');
  const buttons = page.locator('button.more[data-case-slug]');
  const expectedSlugs = [
    'healthcare-voice-assistant',
    'sop-fastapi-starter',
    'sign-language-ai',
  ];
  for (let i = 0; i < expectedSlugs.length; i++) {
    await buttons.nth(i).click();
    const modal = page.locator('.cs-backdrop .cs-panel');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.cs-slug')).toContainText(expectedSlugs[i]!);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  }
});
