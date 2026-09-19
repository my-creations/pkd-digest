const { test, expect } = require('@playwright/test');

// Fold outer display (~344px CSS width): the PT labels (Digest · Cronologia ·
// Começar aqui) used to clip against the pinned locale pill. The two-row
// topbar (brand + pill on row one, wrapping nav on row two) must keep every
// target fully inside the viewport, with no JS involved.
test.describe('mobile two-row topbar at 344px', () => {
  test.use({ viewport: { width: 344, height: 800 } });

  for (const locale of ['en', 'pt']) {
    const home = locale === 'pt' ? 'pt/' : './';
    test(`${locale}: nav links and locale pill fit without clipping`, async ({ page }) => {
      await page.goto(home);

      const targets = page.locator('.topbar__brand, .topbar .nav a, .topbar .locale-switcher');
      await expect(targets.first()).toBeVisible();
      expect(await targets.count()).toBeGreaterThan(0);

      const viewport = page.viewportSize();
      const count = await targets.count();
      for (let index = 0; index < count; index += 1) {
        const box = await targets.nth(index).boundingBox();
        expect(box, `topbar target ${index} has a box`).not.toBeNull();
        expect(box.x, `topbar target ${index} left edge`).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width, `topbar target ${index} right edge`).toBeLessThanOrEqual(viewport.width + 1);
      }

      // Two rows: the nav sits below the brand/locale row.
      const brand = await page.locator('.topbar__brand').boundingBox();
      const nav = await page.locator('.topbar .nav').boundingBox();
      expect(brand).not.toBeNull();
      expect(nav).not.toBeNull();
      expect(nav.y).toBeGreaterThanOrEqual(brand.y + brand.height - 1);
    });
  }

  test('brand label stays desktop-hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('pt/');
    await expect(page.locator('.topbar__brand')).toBeHidden();
    await expect(page.locator('.topbar .nav a', { hasText: 'Começar aqui' })).toBeVisible();
  });
});
