const { test, expect } = require('@playwright/test');
const bundles = require('../../src/_data/topicBundles');

for (const locale of ['en', 'pt']) {
  const prefix = locale === 'pt' ? 'pt/' : '';
  const otherPrefix = locale === 'pt' ? '' : 'pt/';
  const title = locale === 'pt' ? 'Coleções temáticas' : 'Thematic collections';

  test(`${locale} collections index is translated and linked from the footer`, async ({ page }) => {
    await page.goto(prefix || './');
    await page.locator('.site-footer').getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(new RegExp(`/${prefix}collections/$`));
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main h1')).toHaveText(title);
    const links = page.locator('main .archive-issue h2 a');
    await expect(links).toHaveCount(3);
    for (const [index, bundle] of bundles.entries()) {
      await expect(links.nth(index)).toHaveText(bundle.title[locale]);
      await expect(links.nth(index)).toHaveAttribute('href', `/pkd-digest/${prefix}collections/${bundle.slug}/`);
    }
    await page.locator('.locale-switcher a').click();
    await expect(page).toHaveURL(new RegExp(`/${otherPrefix}collections/$`));
  });

  for (const bundle of bundles) {
    test(`${locale} ${bundle.slug} links published cards and preserves locale context`, async ({ page, request }) => {
      await page.goto(`${prefix}collections/${bundle.slug}/`);
      await expect(page.locator('main h1')).toHaveText(bundle.title[locale]);
      await expect(page.locator('main .lede')).toHaveText(bundle.lede[locale]);
      const links = page.locator('main .archive-issue h3 a');
      await expect(links).toHaveCount(bundle.cardSlugs.length);
      for (const [index, slug] of bundle.cardSlugs.entries()) {
        const href = `/pkd-digest/${prefix}digest/${slug}/`;
        await expect(links.nth(index)).toHaveAttribute('href', href);
        expect((await request.get(href)).ok()).toBeTruthy();
      }
      for (const [lang, pathPrefix] of [
        ['en', ''],
        ['pt', 'pt/'],
      ]) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveAttribute(
          'href',
          `https://my-creations.github.io/pkd-digest/${pathPrefix}collections/${bundle.slug}/`
        );
      }
      await page.locator('.locale-switcher a').click();
      await expect(page).toHaveURL(new RegExp(`/${otherPrefix}collections/${bundle.slug}/$`));
      await page.locator('main .page-header a').click();
      await expect(page).toHaveURL(new RegExp(`/${otherPrefix}collections/$`));
    });
  }
}
