const { test, expect } = require('@playwright/test');

const SLUG = 'kdoqi-us-commentary-kdigo-2025-adpkd-guideline-2026';

test.describe('card permalinks', () => {
  test('renders the standalone EN card with dual framing', async ({ page }) => {
    await page.goto(`digest/${SLUG}/`);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main h1')).toContainText('KDOQI US Commentary');
    await expect(page.locator('.item-card__block--plain p')).toContainText('U.S. kidney experts');
    await expect(page.locator('.item-card__block--clinical p')).toContainText('KDOQI society commentary');
    await expect(page.locator('.card-back a')).toHaveAttribute('href', '/pkd-digest/digest/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://my-creations.github.io/pkd-digest/digest/${SLUG}/`
    );
  });

  test('renders the PT card as a real translation', async ({ page }) => {
    await page.goto(`pt/digest/${SLUG}/`);

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
    await expect(page.locator('main h1')).toContainText('Comentário KDOQI');
    await expect(page.locator('.item-card__block--plain p')).toContainText('Especialistas renais');
    await expect(page.locator('.card-back a')).toHaveAttribute('href', '/pkd-digest/pt/digest/');
  });

  test('card pages cross-link EN/PT alternates in metadata', async ({ page }) => {
    await page.goto(`digest/${SLUG}/`);
    await expect(page.locator('link[rel="alternate"][hreflang="pt"]')).toHaveAttribute(
      'href',
      `https://my-creations.github.io/pkd-digest/pt/digest/${SLUG}/`
    );

    await page.goto(`pt/digest/${SLUG}/`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      `https://my-creations.github.io/pkd-digest/digest/${SLUG}/`
    );
  });

  test('drafts and placeholders get no standalone page', async ({ request }) => {
    for (const slug of ['sample-placeholder', 'sample-placeholder-2']) {
      const en = await request.get(`digest/${slug}/`);
      expect(en.status()).toBe(404);
      const pt = await request.get(`pt/digest/${slug}/`);
      expect(pt.status()).toBe(404);
    }
  });

  test('shows related cards without linking to itself', async ({ page }) => {
    await page.goto(`digest/${SLUG}/`);

    const section = page.locator('.card-related');
    await expect(section.locator('h2')).toContainText('See also');
    const links = section.locator('a');
    expect(await links.count()).toBe(3);
    for (let index = 0; index < 3; index += 1) {
      const href = await links.nth(index).getAttribute('href');
      expect(href).toMatch(/^\/pkd-digest\/digest\/.+\/$/);
      expect(href).not.toContain(SLUG);
    }
  });

  test('related cards use the PT locale on PT pages', async ({ page }) => {
    await page.goto(`pt/digest/${SLUG}/`);

    const section = page.locator('.card-related');
    await expect(section.locator('h2')).toContainText('Ver também');
    const links = section.locator('a');
    expect(await links.count()).toBe(3);
    for (let index = 0; index < 3; index += 1) {
      const href = await links.nth(index).getAttribute('href');
      expect(href).toMatch(/^\/pkd-digest\/pt\/digest\/.+\/$/);
    }
  });

  test('language switcher maps a card to the same card', async ({ page }) => {
    await page.goto(`digest/${SLUG}/`);
    await page.locator('.locale-switcher a.locale-option[hreflang="pt"]').click();

    await expect(page).toHaveURL(new RegExp(`/pt/digest/${SLUG}/$`));
    await expect(page.locator('main h1')).toContainText('Comentário KDOQI');
  });

  test('card source link opens in a new tab', async ({ page }) => {
    await page.goto(`digest/${SLUG}/`);

    const source = page.locator('.item-card__footer a[href^="http"]');
    await expect(source).toHaveAttribute('target', '_blank');
    await expect(source).toHaveAttribute('rel', /noopener/);
  });

  test('digest river titles link to their standalone cards', async ({ page }) => {
    await page.goto('digest/');

    const leadLink = page.locator('.digest-lead h2 a.digest-link');
    const href = await leadLink.getAttribute('href');
    expect(href).toMatch(/\/digest\/.+\/$/);

    await leadLink.click();
    await expect(page.locator('main h1')).toBeVisible();
  });
});
