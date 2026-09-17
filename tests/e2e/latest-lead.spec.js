const { test, expect } = require('@playwright/test');
const i18n = require('../../src/_data/i18n');

for (const locale of ['en', 'pt']) {
  const prefix = locale === 'pt' ? 'pt/' : '';
  const digestPath = locale === 'pt' ? 'pt/digest/' : 'digest/';

  test(`${locale} home river features the issue lead story`, async ({ page }) => {
    await page.goto(prefix || './');
    const river = page.locator('.section--latest .digest-river');
    await expect(river.locator('.digest-kicker')).toContainText(i18n[locale].digest.leadStory);
    const title = river.locator('h3 a');
    await expect(title).toHaveAttribute('href', `/pkd-digest/${digestPath}#digest-item-1`);
    await expect(title).not.toBeEmpty();
    await expect(river.locator('h3 + p')).not.toBeEmpty();
  });
}
