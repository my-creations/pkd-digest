const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('digest accessibility', () => {
  for (const path of [
    'digest/',
    'pt/digest/',
    'digest/kdoqi-us-commentary-kdigo-2025-adpkd-guideline-2026/',
    'pt/digest/kdoqi-us-commentary-kdigo-2025-adpkd-guideline-2026/',
    'search/',
    'pt/search/',
    'archive/',
    'pt/archive/',
  ]) {
    test(`has no axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('keeps bilingual semantic landmarks and metadata', async ({ page }) => {
    await page.goto('digest/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
    await expect(page.locator('a.skip-link')).toBeAttached();
    await expect(page.locator('.topbar nav')).toBeVisible();
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    const topbarLink = page.locator('.topbar nav a').first();
    await topbarLink.focus();
    await expect(topbarLink).toBeFocused();
  });
});
