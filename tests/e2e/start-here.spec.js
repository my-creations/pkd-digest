const { test, expect } = require('@playwright/test');

const guides = [
  { locale: 'en', prefix: '', title: 'Start here', disclaimer: 'not medical advice' },
  { locale: 'pt', prefix: 'pt/', title: 'Começar aqui', disclaimer: 'não constitui aconselhamento médico' },
];

test.describe('start-here guide', () => {
  for (const { locale, prefix, title, disclaimer } of guides) {
    test(`renders the ${locale} guide and localized next steps`, async ({ page }) => {
      await page.goto(`${prefix}start-here/`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('main h1')).toHaveText(title);
      await expect(page.locator('main h2')).toHaveCount(3);
      await expect(page.locator('main')).toContainText('ADPKD');
      await expect(page.locator('main')).toContainText(disclaimer);
      for (const section of ['digest', 'timeline', 'archive']) {
        const link = page.locator(`main a[href="/pkd-digest/${prefix}${section}/"]`);
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(new RegExp(`/${prefix}${section}/$`));
        await expect(page.locator('main h1')).toBeVisible();
        await page.goto(`${prefix}start-here/`);
      }
      const otherPrefix = locale === 'en' ? 'pt/' : '';
      const switcher = page.locator('.locale-switcher a');
      await expect(switcher).toHaveAttribute('href', `/pkd-digest/${otherPrefix}start-here/`);
      await switcher.click();
      await expect(page.locator('main h1')).toHaveText(locale === 'en' ? 'Começar aqui' : 'Start here');
    });

    test(`links from the ${locale} home and footer`, async ({ page }) => {
      await page.goto(prefix || './');
      const homeLink = page.locator('main').getByRole('link', { name: title, exact: true });
      await expect(homeLink).toHaveClass(/button/);
      await homeLink.click();
      await expect(page.locator('main h1')).toHaveText(title);
      await page.goto(`${prefix}digest/`);
      const footerLink = page.locator('.site-footer').getByRole('link', { name: title, exact: true });
      await footerLink.click();
      await expect(page.locator('main h1')).toHaveText(title);
    });
  }

  test('registers both guide URLs with their sitemap alternates', async ({ request }) => {
    const response = await request.get('sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();
    const origin = 'https://my-creations.github.io/pkd-digest/';
    for (const { prefix } of guides) {
      const entries = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
      const entry = entries.find((value) => value.includes(`<loc>${origin}${prefix}start-here/</loc>`));
      expect(entry).toBeDefined();
      expect(entry).toContain(`hreflang="en" href="${origin}start-here/"`);
      expect(entry).toContain(`hreflang="pt" href="${origin}pt/start-here/"`);
    }
  });
});
