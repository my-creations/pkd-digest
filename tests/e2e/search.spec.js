const { test, expect } = require('@playwright/test');

test.describe('client-side search', () => {
  test('footer links to the search page', async ({ page }) => {
    await page.goto('digest/');
    await page.locator('.site-footer__links a', { hasText: 'Search' }).click();
    await expect(page).toHaveURL(/\/search\/$/);
    await expect(page.locator('main h1')).toContainText('Search cards');
  });

  test('finds cards by title with links to permalinks', async ({ page }) => {
    await page.goto('search/');
    await page.locator('#search-input').fill('KDOQI');

    const results = page.locator('[data-search-results] li');
    await expect(results.first()).toBeVisible();
    await expect(page.locator('[data-search-status]')).toContainText('matching card');
    await expect(results.first().locator('a')).toHaveAttribute(
      'href',
      '/digest/kdoqi-us-commentary-kdigo-2025-adpkd-guideline-2026/'
    );
  });

  test('searches accent-insensitively in Portuguese', async ({ page }) => {
    await page.goto('pt/search/');
    await expect(page.locator('main h1')).toContainText('Pesquisar cartões');

    // 'infeção' in the data, typed without the accent.
    await page.locator('#search-input').fill('infecao');

    const results = page.locator('[data-search-results] li');
    await expect(results.first()).toBeVisible();
    const href = await results.first().locator('a').getAttribute('href');
    expect(href).toMatch(/^\/pt\/digest\/.+\/$/);
    await expect(page.locator('[data-search-status]')).toContainText('cart');
  });

  test('shows a localized empty state for gibberish', async ({ page }) => {
    await page.goto('search/');
    await page.locator('#search-input').fill('xqzvwk somethingthatmatchesnothing');
    await expect(page.locator('[data-search-results] li')).toHaveCount(0);
    await expect(page.locator('[data-search-status]')).toContainText('No cards match');

    await page.goto('pt/search/');
    await page.locator('#search-input').fill('xqzvwk somethingthatmatchesnothing');
    await expect(page.locator('[data-search-status]')).toContainText('Nenhum cartão');
  });

  test('serves a valid JSON index without drafts', async ({ request }) => {
    for (const path of ['search-index.json', 'pt/search-index.json']) {
      const res = await request.get(path);
      expect(res.ok()).toBeTruthy();
      const index = await res.json();
      expect(Array.isArray(index)).toBe(true);
      expect(index.length).toBeGreaterThan(0);
      for (const entry of index) {
        expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
        expect(entry.title).toMatch(/\S/);
      }
      expect(JSON.stringify(index)).not.toContain('sample-placeholder');
    }
  });

  test('search pages join the sitemap with EN/PT alternates', async ({ request }) => {
    const res = await request.get('sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();
    expect(xml).toContain('<loc>https://my-creations.github.io/pkd-digest/search/</loc>');
    expect(xml).toContain('<loc>https://my-creations.github.io/pkd-digest/pt/search/</loc>');
  });
});
