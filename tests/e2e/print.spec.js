const { test, expect } = require('@playwright/test');

test.describe('print stylesheet', () => {
  test('digest prints both framings without app chrome', async ({ page }) => {
    await page.goto('digest/');
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.topbar')).toBeHidden();
    await expect(page.locator('.site-footer')).toBeHidden();
    await expect(page.locator('[data-filters]')).toBeHidden();
    await expect(page.locator('.digest-rail')).toBeHidden();
    await expect(page.locator('.digest-lead [data-dual-view="clinical"]')).toBeHidden();

    // Both framings print even though clinical starts hidden on screen.
    await expect(page.locator('.digest-lead [data-dual-panel="plain"]')).toBeVisible();
    await expect(page.locator('.digest-lead [data-dual-panel="clinical"]')).toBeVisible();
    await expect(page.locator('.digest-lead h2')).toBeVisible();
  });

  test('timeline cards print both framings', async ({ page }) => {
    await page.goto('timeline/');
    await page.emulateMedia({ media: 'print' });

    const card = page.locator('.timeline-list [data-dual]').first();
    await expect(card.locator('[data-dual-panel="plain"]')).toBeVisible();
    await expect(card.locator('[data-dual-panel="clinical"]')).toBeVisible();
  });
});
