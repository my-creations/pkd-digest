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
    expect(await page.locator('[data-dual-panel="clinical"]').count()).toBe(linkCount);

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

  test('clinical framing opens on demand via the toggle', async ({ page }) => {
    await page.goto('digest/');

    const lead = page.locator('.digest-lead');
    await expect(lead.locator('[data-dual-panel="clinical"]')).toBeHidden();
    await lead.locator('[data-dual-view="clinical"]').click();
    await expect(lead.locator('[data-dual-panel="clinical"]')).toBeVisible();
  });

  test('switches to the Portuguese digest with localized rail copy', async ({ page }) => {
    await page.goto('digest/');
    await page.locator('.locale-switcher a.locale-option[hreflang="pt"]').click();

    await expect(page).toHaveURL(/\/pt\/digest\/$/);
    await expect(page.locator('.digest-rail h2')).toContainText('Nesta edição');
    await expect(page.locator('.digest-lead .digest-kicker')).toContainText('Destaque');
    await expect(page.locator('.locale-switcher .locale-option.is-current')).toContainText('PT');
  });

  test('external source links open in a new tab', async ({ page }) => {
    await page.goto('digest/');

    const external = page.locator('.digest-river a[href^="http"]');
    expect(await external.count()).toBeGreaterThan(0);
    for (let index = 0; index < (await external.count()); index += 1) {
      await expect(external.nth(index)).toHaveAttribute('target', '_blank');
      await expect(external.nth(index)).toHaveAttribute('rel', /noopener/);
    }
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
