const { test, expect } = require('@playwright/test');
const i18n = require('../../src/_data/i18n');

for (const locale of ['en', 'pt']) {
  const prefix = locale === 'pt' ? 'pt/' : '';
  const copy = i18n[locale].home;

  test(`${locale} home shows the 3D kidney section with working controls`, async ({ page }) => {
    await page.goto(prefix || './');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);

    const section = page.locator('[data-kidney3d]');
    await expect(section).toBeVisible();
    await expect(page.locator('#kidney3d-heading')).toHaveText(copy.kidneyTitle);
    await expect(section.locator('.lede, p').first()).toBeVisible();

    const external = section.getByRole('button', { name: copy.kidneyViewExternal });
    const crossSection = section.getByRole('button', { name: copy.kidneyViewSection });
    const cysts = section.getByRole('button', { name: copy.kidneyViewCysts });
    const healthy = section.getByRole('button', { name: copy.kidneyModeHealthy });
    const cystic = section.getByRole('button', { name: copy.kidneyModeCystic });

    await expect(external).toHaveAttribute('aria-pressed', 'true');
    await expect(healthy).toHaveAttribute('aria-pressed', 'true');

    await cystic.click();
    await expect(cystic).toHaveAttribute('aria-pressed', 'true');
    await expect(cystic).toHaveClass(/is-active/);
    await expect(healthy).toHaveAttribute('aria-pressed', 'false');

    await crossSection.click();
    await expect(crossSection).toHaveAttribute('aria-pressed', 'true');
    await expect(external).toHaveAttribute('aria-pressed', 'false');
    await expect(cysts).toBeVisible();

    const slider = section.locator('[data-kidney3d-severity]');
    await expect(slider).toBeVisible();
    await slider.fill('5');
    await expect(slider).toHaveValue('5');

    await expect(section.locator('.kidney3d__table tbody tr')).toHaveCount(5);
    await section.locator('.kidney3d__alt > summary').click();
    await section.getByRole('button', { name: copy.kidneyCortex }).click();
    await expect(section.locator('[data-kidney3d-status]')).toHaveText(copy.kidneyCortex);

    await expect(page.locator('script[type="module"][src$="/js/kidney3d.js"]')).toHaveCount(1);
  });
}
