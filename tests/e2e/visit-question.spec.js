const { test, expect } = require('@playwright/test');
const { loadDocuments } = require('../../scripts/validate-content');
const i18n = require('../../src/_data/i18n');

const published = loadDocuments().documents.filter(({ data }) => data.status === 'published' && !data.placeholder);
const example = published.find(({ file }) => file.startsWith('kdoqi-'));
const slug = example.file.replace(/\.md$/, '');

for (const locale of ['en', 'pt']) {
  const prefix = locale === 'pt' ? 'pt/' : '';

  test(`${locale}: visit questions render on card pages without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${test.info().project.use.baseURL}${prefix}digest/${slug}/`);
    const question = page.locator('[data-visit-question]');
    await expect(question.getByRole('heading')).toHaveText(i18n[locale].digest.visitQuestion);
    await expect(question.locator('p')).toHaveText(example.data.visitQuestion[locale]);
    await expect(question).toBeVisible();
    await context.close();
  });

  test(`${locale}: every weekly digest card shows its question`, async ({ page }) => {
    await page.goto(`${prefix}digest/`);
    const cards = page.locator('[data-filterable]');
    expect(await cards.count()).toBeGreaterThan(1);
    for (const card of await cards.all()) {
      const href = await card.locator('.digest-link').getAttribute('href');
      const source = published.find(({ file }) => href.endsWith(`/digest/${file.replace(/\.md$/, '')}/`));
      const question = card.locator('[data-visit-question]');
      await expect(question.getByRole('heading')).toHaveText(i18n[locale].digest.visitQuestion);
      await expect(question.locator('p')).toHaveText(source.data.visitQuestion[locale]);
      await card.locator('[data-dual-view="clinical"]').click();
      await expect(question).toBeVisible();
    }
  });

  test(`${locale}: timeline uses the shared question block`, async ({ page }) => {
    await page.goto(`${prefix}timeline/`);
    await expect(page.locator('[data-visit-question]')).toHaveCount(published.length);
  });

  test(`${locale}: visit question text is indexed and searchable`, async ({ page, request }) => {
    const response = await request.get(`${prefix}search-index.json`);
    const index = await response.json();
    expect(index.find((card) => card.slug === slug).visitQuestion).toBe(example.data.visitQuestion[locale]);
    const loaded = page.waitForResponse((res) => res.url().endsWith('/search-index.json'));
    await page.goto(`${prefix}search/`);
    await loaded;
    await page.locator('input[type="search"]').fill(example.data.visitQuestion[locale]);
    await expect(page.locator('[data-search-results] a')).toHaveText([example.data.title[locale]]);
  });
}
