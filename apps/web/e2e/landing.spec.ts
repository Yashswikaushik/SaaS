import { expect, test } from '@playwright/test';

test('landing page renders hero and CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(['Find verified', 'B2B leads on a map']);
  await expect(page.getByRole('link', { name: /Start free/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /See pricing in ₹/i })).toBeVisible();
});

test('pricing page lists plans', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText('Free')).toBeVisible();
  await expect(page.getByText('Starter')).toBeVisible();
  await expect(page.getByText('Growth')).toBeVisible();
  await expect(page.getByText('Scale')).toBeVisible();
  await expect(page.getByText('Agency')).toBeVisible();
});

test('legal pages render', async ({ page }) => {
  for (const url of ['/legal/privacy', '/legal/terms', '/legal/dpa', '/legal/grievance', '/legal/cookies']) {
    await page.goto(url);
    await expect(page.locator('article')).toBeVisible();
  }
});
