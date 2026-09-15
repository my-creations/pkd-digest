const { test, expect } = require('@playwright/test');

// Baselines are chromium-only: one rendering engine keeps snapshots stable
// across local dev and CI. Firefox/WebKit still run every other spec.
test.skip(({ browserName }) => browserName !== 'chromium', 'chromium-only baselines');

test.describe('visual regression', () => {
  for (const path of ['digest/', 'pt/digest/']) {
    test(`matches snapshot on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot({ fullPage: true, maxDiffPixelRatio: 0.01 });
    });
  }
});
