const { test, expect } = require('@playwright/test');
const i18n = require('../../src/_data/i18n');

for (const locale of ['en', 'pt']) {
  const path = locale === 'pt' ? 'pt/' : './';
  const digestHref = `/pkd-digest/${locale === 'pt' ? 'pt/digest/' : 'digest/'}`;
  const timelineHref = `/pkd-digest/${locale === 'pt' ? 'pt/timeline/' : 'timeline/'}`;

  test(`${locale} hero has a single primary CTA`, async ({ page }) => {
    await page.goto(path);
    const actions = page.locator('.hero__actions');
    const primary = actions.locator('a.button--primary');
    await expect(primary).toHaveCount(1);
    await expect(primary).toHaveAttribute('href', digestHref);
    await expect(primary).toContainText(i18n[locale].home.ctaDigest);

    const secondaryLink = actions.locator('a.hero__link');
    await expect(secondaryLink).toHaveAttribute('href', timelineHref);
    await expect(secondaryLink).toContainText(i18n[locale].home.ctaTimeline);
  });
}
