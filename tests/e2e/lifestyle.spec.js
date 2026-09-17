const { test, expect } = require('@playwright/test');

test.describe('lifestyle guide', () => {
  for (const locale of ['en', 'pt']) {
    const prefix = locale === 'pt' ? 'pt/' : '';
    const title = locale === 'pt' ? 'Cuidados e estilo de vida' : 'Care and lifestyle';

    test(`renders the ${locale} lifestyle guide without JavaScript and links from the footer`, async ({
      browser,
      baseURL,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
      const page = await context.newPage();
      await page.goto(`${prefix}lifestyle/`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('main h1')).toHaveText(title);
      await expect(page.locator('main .section h2')).toHaveCount(6);
      await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute('href', /\/pt\/lifestyle\/$/);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        'href',
        /\/pkd-digest\/lifestyle\/$/
      );
      await page.goto(`${prefix}digest/`);
      await page.locator('.site-footer__links a', { hasText: title }).click();
      await expect(page).toHaveURL(new RegExp(`/pkd-digest/${prefix}lifestyle/$`));
      await context.close();
    });

    test(`switches language from the ${locale} lifestyle guide`, async ({ page }) => {
      await page.goto(`${prefix}lifestyle/`);
      const switcher = page.locator('.locale-switcher a');
      await switcher.focus();
      await expect(switcher).toBeFocused();
      await switcher.press('Enter');
      await expect(page.locator('main h1')).toHaveText(
        locale === 'en' ? 'Cuidados e estilo de vida' : 'Care and lifestyle'
      );
    });
  }
});
