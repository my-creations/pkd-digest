const { test, expect } = require('@playwright/test');

// Pixel snapshots were tried and rejected: full-page images depend on the
// OS font stack (local vs CI render different line breaks) and break on
// every legitimate content update. These invariants catch the real visual
// bugs (overlaps, broken sticky, collapsed layout) deterministically.

async function rect(locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return { left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height };
}

async function computedPosition(locator) {
  return locator.evaluate((el) => getComputedStyle(el).position);
}

test.describe('visual layout invariants', () => {
  test('masthead, section bar, rail, and lead render without overlap', async ({ page }) => {
    await page.goto('digest/');
    const wide = page.viewportSize().width >= 760;

    for (const sel of ['.masthead', '.topbar', '.digest-dateline', '.digest-rail', '.digest-lead']) {
      await expect(page.locator(sel).first()).toBeVisible();
    }

    const rail = await rect(page.locator('.digest-rail'));
    const lead = await rect(page.locator('.digest-lead'));
    if (wide) {
      const river = await rect(page.locator('.digest-river'));
      expect(rail.right).toBeLessThanOrEqual(river.left + 1);
      expect(await computedPosition(page.locator('.digest-rail'))).toBe('sticky');
    } else {
      expect(await computedPosition(page.locator('.digest-rail'))).toBe('static');
      expect(rail.bottom).toBeLessThanOrEqual(lead.top + 1);
    }

    const firstItem = await rect(page.locator('.digest-item').first());
    expect(lead.bottom).toBeLessThanOrEqual(firstItem.top + 1);
  });

  test('section bar stays stuck while the river scrolls', async ({ page }) => {
    await page.goto('digest/');

    const bar = page.locator('.topbar');
    await expect(bar).toBeVisible();
    expect(await computedPosition(bar)).toBe('sticky');

    await page.locator('#digest-item-3').scrollIntoViewIfNeeded();
    const box = await rect(bar);
    expect(box.top).toBeLessThanOrEqual(1);
    expect(box.bottom).toBeGreaterThan(0);
  });
});
