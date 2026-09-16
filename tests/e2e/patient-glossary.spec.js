const { test, expect } = require('@playwright/test');
const patientGlossary = require('../../src/_data/patientGlossary');

test.describe('patient dictionary', () => {
  for (const locale of ['en', 'pt']) {
    const prefix = locale === 'pt' ? 'pt/' : '';
    const title = locale === 'pt' ? 'Dicionário do doente' : 'Patient dictionary';

    test(`renders all ${locale} definitions without JavaScript and links from the footer`, async ({
      browser,
      baseURL,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
      const page = await context.newPage();
      await page.goto(`${prefix}glossary/`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('main h1')).toHaveText(title);
      await expect(page.locator('.patient-glossary dt')).toHaveCount(patientGlossary.length);
      await expect(page.locator('.patient-glossary dd')).toHaveCount(patientGlossary.length);
      for (const entry of patientGlossary) {
        const definition = page.locator(`#glossary-${entry.id}`);
        await expect(definition.locator('dfn')).toHaveText(entry.term[locale]);
        await expect(definition.locator('dd')).toHaveText(entry.shortDef[locale]);
        await expect(definition.locator('dd')).toBeVisible();
      }
      await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute('href', /\/pt\/glossary\/$/);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        'href',
        /\/pkd-digest\/glossary\/$/
      );
      await page.goto(`${prefix}digest/`);
      await page.locator('.site-footer__links a', { hasText: title }).click();
      await expect(page).toHaveURL(new RegExp(`/pkd-digest/${prefix}glossary/$`));
      await context.close();
    });

    test(`switches language from the ${locale} dictionary with keyboard access`, async ({ page }) => {
      await page.goto(`${prefix}glossary/`);
      const switcher = page.locator('.locale-switcher a');
      await switcher.focus();
      await expect(switcher).toBeFocused();
      await switcher.press('Enter');
      await expect(page.locator('main h1')).toHaveText(locale === 'en' ? 'Dicionário do doente' : 'Patient dictionary');
    });
  }
});
