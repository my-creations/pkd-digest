const { test, expect } = require('@playwright/test');

test.describe('timeline broadsheet rail', () => {
  test('renders the rail index and river from the same published items', async ({ page }) => {
    await page.goto('timeline/');

    await expect(page.locator('.timeline-list').first()).toBeVisible();
    await expect(page.locator('.digest-rail h2')).toContainText('On this timeline');

    const railLinks = page.locator('.digest-rail ol a');
    const cards = page.locator('.digest-river .timeline-list > li');
    const linkCount = await railLinks.count();

    expect(linkCount).toBeGreaterThan(0);
    expect(await cards.count()).toBe(linkCount);

    for (let index = 0; index < linkCount; index += 1) {
      const target = `#timeline-item-${index + 1}`;
      await expect(railLinks.nth(index)).toHaveAttribute('href', target);
      await expect(page.locator(target)).toBeVisible();
    }
  });

  test('rail anchors jump to the matching timeline card', async ({ page }) => {
    await page.goto('timeline/');

    await page.locator('.digest-rail ol a').first().click();
    await expect(page).toHaveURL(/#timeline-item-1$/);
    await expect(page.locator('#timeline-item-1')).toBeInViewport();
  });

  test('rail sits beside the river on desktop and stacks on mobile', async ({ page }) => {
    await page.goto('timeline/');
    const wide = page.viewportSize().width >= 760;

    const position = await page.locator('.digest-rail').evaluate((el) => getComputedStyle(el).position);
    if (wide) {
      expect(position).toBe('sticky');
      const railBox = await page.locator('.digest-rail').boundingBox();
      const riverBox = await page.locator('.digest-river').boundingBox();
      const railRight = railBox.x + railBox.width;
      expect(railRight).toBeLessThanOrEqual(riverBox.x + 1);
    } else {
      expect(position).toBe('static');
    }
  });

  test('rail syncs with filters card for card', async ({ page }) => {
    await page.goto('timeline/');

    const total = await page.locator('.digest-river .timeline-list > li').count();
    expect(total).toBeGreaterThan(0);

    await page.locator('[data-filter-group="tag"] [data-filter-value="research"]').click();

    const shown = await page.locator('.digest-river .timeline-list > li:not([hidden])').count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThanOrEqual(total);
    expect(await page.locator('.digest-rail li:not([hidden])').count()).toBe(shown);
  });

  test('shows the localized rail copy in Portuguese', async ({ page }) => {
    await page.goto('pt/timeline/');

    await expect(page.locator('.digest-rail h2')).toContainText('Nesta cronologia');

    const railLinks = page.locator('.digest-rail ol a');
    const linkCount = await railLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    await expect(railLinks.first()).toHaveAttribute('href', '#timeline-item-1');
    await expect(page.locator('#timeline-item-1')).toBeVisible();
  });
});

test.describe('home latest-issue rail', () => {
  test('indexes the latest issue and links into the digest', async ({ page }) => {
    await page.goto('./');

    await expect(page.locator('.section--latest .eyebrow')).toContainText('Latest issue');
    await expect(page.locator('#latest-heading')).toContainText('This week’s issue');

    const homeLinks = page.locator('.section--latest .digest-rail ol a');
    const homeCount = await homeLinks.count();
    expect(homeCount).toBeGreaterThan(0);

    await expect(homeLinks.first()).toHaveAttribute('href', '/pkd-digest/digest/#digest-item-1');
    for (let index = 0; index < homeCount; index += 1) {
      await expect(homeLinks.nth(index)).toHaveAttribute('href', `/pkd-digest/digest/#digest-item-${index + 1}`);
    }

    // Same cards as the digest river.
    await expect(page.locator('.section--latest a.button--primary')).toHaveAttribute('href', '/pkd-digest/digest/');
    await page.goto('digest/');
    expect(await page.locator('.digest-river article').count()).toBe(homeCount);
  });

  test('portuguese home links into the portuguese digest', async ({ page }) => {
    await page.goto('pt/');

    await expect(page.locator('.section--latest .eyebrow')).toContainText('Edição mais recente');
    await expect(page.locator('#latest-heading')).toContainText('A edição desta semana');
    await expect(page.locator('.section--latest .digest-rail h2')).toContainText('Nesta edição');

    const homeLinks = page.locator('.section--latest .digest-rail ol a');
    expect(await homeLinks.count()).toBeGreaterThan(0);
    await expect(homeLinks.first()).toHaveAttribute('href', '/pkd-digest/pt/digest/#digest-item-1');
  });
});
