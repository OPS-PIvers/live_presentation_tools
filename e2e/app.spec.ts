import { test, expect } from '@playwright/test';

test('application loads and displays toolbar', async ({ page }) => {
  await page.goto('/');

  // Check that the page loads
  await expect(page).toHaveTitle(/Interactive Presentation Tool/);

  // Check that the toolbar is visible
  await expect(page.getByRole('toolbar')).toBeVisible();

  // Check that main tools are present
  await expect(page.getByTitle(/Pan & Zoom/)).toBeVisible();
  await expect(page.getByTitle(/Spotlight/)).toBeVisible();
  await expect(page.getByTitle(/Capturing/)).toBeVisible();
});
