const { test, expect } = require('@playwright/test');

test.describe('digest broadsheet rail', () => {
  test('renders the masthead, section nav, and language toggle', async ({ page }) => {
    await page.goto('digest/');

    await expect(page.locator('.masthead .wordmark__name')).toContainText('PKD Digest');
    await expect(page.locator('.topbar nav a[aria-current="page"]')).toContainText('Digest');
    await expect(page.locator('.topbar nav a', { hasText: 'Timeline' })).toBeVisible();
    await expect(page.locator('.locale-switcher .locale-option.is-current')).toContainText('EN');
    await expect(page.locator('.locale-switcher a.locale-option[hreflang="pt"]')).toHaveAttribute(
      'href',
      '/pkd-digest/pt/digest/'
    );
  });

  test('renders the issue rail and river from the same published items', async ({ page }) => {
    await page.goto('digest/');

    const railLinks = page.locator('.digest-rail ol a');
    const articles = page.locator('.digest-river article');
    const linkCount = await railLinks.count();
    const articleCount = await articles.count();

    expect(linkCount).toBeGreaterThan(0);
    expect(articleCount).toBe(linkCount);
    expect(await page.locator('.digest-standfirst, .digest-lede').count()).toBe(linkCount);
    expect(await page.locator('details.digest-clinical').count()).toBe(linkCount);

    for (let index = 0; index < linkCount; index += 1) {
      const target = `#digest-item-${index + 1}`;
      await expect(railLinks.nth(index)).toHaveAttribute('href', target);
      await expect(page.locator(target)).toBeVisible();
    }

    await expect(page.locator('.digest-dateline')).toContainText('Weekly issue');
    await expect(page.locator('.digest-dateline')).toContainText('not medical advice');
  });

  test('rail anchors jump to the matching numbered article', async ({ page }) => {
    await page.goto('digest/');

    await page.locator('.digest-rail ol a').first().click();
    await expect(page).toHaveURL(/#digest-item-1$/);
    await expect(page.locator('#digest-item-1')).toBeInViewport();
  });

  test('clinical disclosures open on demand', async ({ page }) => {
    await page.goto('digest/');

    const clinical = page.locator('details.digest-clinical').first();
    await expect(clinical).not.toHaveAttribute('open', '');
    await clinical.locator('summary').click();
    await expect(clinical).toHaveAttribute('open', '');
  });

  test('switches to the Portuguese digest with localized rail copy', async ({ page }) => {
    await page.goto('digest/');
    await page.locator('.locale-switcher a.locale-option[hreflang="pt"]').click();

    await expect(page).toHaveURL(/\/pt\/digest\/$/);
    await expect(page.locator('.digest-rail h2')).toContainText('Nesta edição');
    await expect(page.locator('.digest-lead .digest-kicker')).toContainText('Destaque');
    await expect(page.locator('.locale-switcher .locale-option.is-current')).toContainText('PT');
  });

  test('has no horizontal page overflow', async ({ page }) => {
    await page.goto('digest/');

    const overflow = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));

    expect(overflow.pageWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  });
});
