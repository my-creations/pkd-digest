const { test, expect } = require('@playwright/test');

async function visibleCards(page, scope = '.digest-river') {
  return page.locator(`${scope} [data-filterable]:not([hidden])`).count();
}

test.describe('card filters', () => {
  test('narrows digest cards by topic and syncs the rail', async ({ page }) => {
    await page.goto('digest/');

    const total = await page.locator('.digest-river [data-filterable]').count();
    expect(total).toBeGreaterThan(0);
    await expect(page.locator('[data-filters-count]')).toContainText(`Showing ${total} cards.`);

    await page.locator('[data-filter-group="tag"] [data-filter-value="advocacy"]').click();

    const shown = await visibleCards(page);
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(total);
    await expect(page.locator('[data-filters-count]')).toContainText(`Showing ${shown} cards.`);

    // Every visible card carries the tag; the rail matches article for article.
    const tags = await page
      .locator('.digest-river [data-filterable]:not([hidden])')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.tags));
    expect(tags.every((value) => value.split(' ').includes('advocacy'))).toBe(true);
    expect(await page.locator('.digest-rail li:not([hidden])').count()).toBe(shown);

    // Toggle state is exposed to assistive tech.
    await expect(page.locator('[data-filter-group="tag"] [data-filter-value="advocacy"]')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('combines audience filter and resets', async ({ page }) => {
    await page.goto('digest/');
    const total = await page.locator('.digest-river [data-filterable]').count();

    await page.locator('[data-filter-group="audience"] [data-filter-value="clinicians"]').click();
    const shown = await visibleCards(page);
    expect(shown).toBeLessThanOrEqual(total);
    const audiences = await page
      .locator('.digest-river [data-filterable]:not([hidden])')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.audience));
    expect(audiences.every((value) => value.split(' ').includes('clinicians'))).toBe(true);

    await page.locator('[data-filters-reset]').click();
    expect(await visibleCards(page)).toBe(total);
    await expect(page.locator('[data-filters-count]')).toContainText(`Showing ${total} cards.`);
  });

  test('shows an empty state when nothing matches', async ({ page }) => {
    await page.goto('digest/');

    // Find a topic × audience pair with zero matches in the live data.
    const combo = await page.locator('.digest-river [data-filterable]').evaluateAll((nodes) => {
      const tags = ['research', 'treatment', 'lifestyle', 'advocacy'];
      const audiences = ['patients', 'clinicians'];
      const cards = nodes.map((node) => ({
        tags: (node.dataset.tags || '').split(' ').filter(Boolean),
        audience: (node.dataset.audience || '').split(' ').filter(Boolean),
      }));
      for (const tag of tags) {
        for (const audience of audiences) {
          if (!cards.some((card) => card.tags.includes(tag) && card.audience.includes(audience))) {
            return { tag, audience };
          }
        }
      }
      return null;
    });
    expect(combo).not.toBeNull();

    await page.locator(`[data-filter-group="tag"] [data-filter-value="${combo.tag}"]`).click();
    await page.locator(`[data-filter-group="audience"] [data-filter-value="${combo.audience}"]`).click();

    expect(await visibleCards(page)).toBe(0);
    await expect(page.locator('[data-filters-empty]')).toBeVisible();
    await expect(page.locator('[data-filters-count]')).toContainText('No cards match');
  });

  test('filters work in Portuguese with localized labels', async ({ page }) => {
    await page.goto('pt/digest/');
    const total = await page.locator('.digest-river [data-filterable]').count();

    await expect(page.locator('[data-filter-group="tag"]')).toContainText('Tema');
    await expect(page.locator('[data-filters-count]')).toContainText(`A mostrar ${total} cartões.`);

    await page.locator('[data-filter-group="tag"] [data-filter-value="advocacy"]').click();
    const shown = await visibleCards(page);
    expect(shown).toBeLessThan(total);
    await expect(page.locator('[data-filters-count]')).toContainText('A mostrar');
  });

  test('filters narrow the timeline list', async ({ page }) => {
    await page.goto('timeline/');
    const total = await page.locator('.timeline-list [data-filterable]').count();
    expect(total).toBeGreaterThan(0);

    await page.locator('[data-filter-group="audience"] [data-filter-value="patients"]').click();
    const shown = await page.locator('.timeline-list [data-filterable]:not([hidden])').count();
    expect(shown).toBeLessThanOrEqual(total);
    expect(shown).toBeGreaterThan(0);

    await page.locator('[data-filters-reset]').click();
    expect(await page.locator('.timeline-list [data-filterable]:not([hidden])').count()).toBe(total);
  });

  test('timeline list section renders without an outer frame', async ({ page }) => {
    for (const path of ['timeline/', 'pt/timeline/']) {
      await page.goto(path);
      const section = page.locator('.timeline-list').locator('xpath=ancestor::section[1]');
      await expect(section).toHaveClass(/section--bare/);
      expect(await section.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('0px');
    }
  });
});
