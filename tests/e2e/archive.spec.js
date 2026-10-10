const { test, expect } = require('@playwright/test');
const { loadDocuments } = require('../../scripts/validate-content');

// The newest issue moves every week, so read it from the cards instead of pinning it.
const published = loadDocuments().documents.filter(
  ({ data }) => data.status === 'published' && !data.placeholder && data.issue
);
const latestIssue = published
  .map(({ data }) => data.issue)
  .sort()
  .at(-1);
const latestCount = published.filter(({ data }) => data.issue === latestIssue).length;

test.describe('issue archive', () => {
  test('lists past issues newest-first with card links', async ({ page }) => {
    await page.goto('archive/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main h1')).toContainText('Issue archive');

    const issues = page.locator('.archive-issue');
    expect(await issues.count()).toBeGreaterThanOrEqual(1);
    await expect(issues.first()).toContainText(latestIssue);
    await expect(issues.first()).toContainText(`${latestCount} cards.`);

    const links = issues.first().locator('a');
    expect(await links.count()).toBe(latestCount);
    await expect(links.first()).toHaveAttribute('href', /\/digest\/.+\/$/);

    await links.first().click();
    await expect(page.locator('main h1')).toBeVisible();
  });

  test('renders the PT archive as a real translation', async ({ page }) => {
    await page.goto('pt/archive/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
    await expect(page.locator('main h1')).toContainText('Arquivo de edições');
    await expect(page.locator('.archive-issue').first()).toContainText(latestIssue);
    await expect(page.locator('.archive-issue').first()).toContainText(`${latestCount} cartões.`);

    const href = await page.locator('.archive-issue').first().locator('a').first().getAttribute('href');
    expect(href).toMatch(/^\/pkd-digest\/pt\/digest\/.+\/$/);
  });

  test('footer links to the archive', async ({ page }) => {
    await page.goto('digest/');
    await page.locator('.site-footer__links a', { hasText: 'Archive' }).click();
    await expect(page).toHaveURL(/\/archive\/$/);
  });

  test('archive pages join the sitemap', async ({ request }) => {
    const res = await request.get('sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();
    expect(xml).toContain('<loc>https://my-creations.github.io/pkd-digest/archive/</loc>');
    expect(xml).toContain('<loc>https://my-creations.github.io/pkd-digest/pt/archive/</loc>');
  });
});
