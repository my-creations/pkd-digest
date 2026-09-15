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

  test('filter bar keeps breathing room above the issue content', async ({ page }) => {
    await page.goto('digest/');

    const bar = page.locator('[data-filters]');
    const shell = page.locator('.digest-shell');
    await expect(bar).toBeVisible();
    await expect(shell).toBeVisible();

    const barBox = await rect(bar);
    const shellBox = await rect(shell);
    expect(shellBox.top).toBeGreaterThanOrEqual(barBox.bottom + 16);
  });

  test('language toggle options are equal and centered', async ({ page }) => {
    for (const path of ['digest/', 'pt/digest/']) {
      await page.goto(path);

      const switcher = page.locator('.locale-switcher');
      const options = switcher.locator('.locale-option');
      await expect(options).toHaveCount(2);

      const switcherBox = await rect(switcher);
      const first = await rect(options.nth(0));
      const second = await rect(options.nth(1));

      // Equal-width segments…
      expect(Math.abs(first.right - first.left - (second.right - second.left))).toBeLessThanOrEqual(1);
      // …optically centered horizontally and vertically inside the pill.
      const middle = (first.right + second.left) / 2;
      const pillMiddle = (switcherBox.left + switcherBox.right) / 2;
      expect(Math.abs(middle - pillMiddle)).toBeLessThanOrEqual(2);
      for (const box of [first, second]) {
        const optionMiddle = (box.top + box.bottom) / 2;
        const pillVertical = (switcherBox.top + switcherBox.bottom) / 2;
        expect(Math.abs(optionMiddle - pillVertical)).toBeLessThanOrEqual(2);
      }
    }
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

test.describe('narrow fold layout', () => {
  // Closed-fold width (~344px): filter labels stack above their chips,
  // chips and switches stay compact and on-screen.
  test.use({ viewport: { width: 344, height: 882 } });

  test('filter rows stack and nothing overflows the viewport', async ({ page }) => {
    for (const path of ['digest/', 'timeline/']) {
      await page.goto(path);

      const overflow = await page.evaluate(() => ({
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(overflow.pageWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);

      const label = page.locator('[data-filter-group="tag"] .filters__label').first();
      const chip = page.locator('[data-filter-group="tag"] .chip').first();
      const labelBox = await rect(label);
      const chipBox = await rect(chip);
      expect(labelBox.bottom).toBeLessThanOrEqual(chipBox.top + 1);

      for (const sel of ['.filters', '.dual__switch']) {
        const box = await rect(page.locator(sel).first());
        expect(box.right).toBeLessThanOrEqual(overflow.viewportWidth + 1);
      }

      // Page titles keep side margins instead of touching the screen edges.
      const headerTitle = await rect(page.locator('.page-header h1'));
      expect(headerTitle.left).toBeGreaterThanOrEqual(12);
      expect(overflow.viewportWidth - headerTitle.right).toBeGreaterThanOrEqual(12);
    }
  });
});

test.describe('page header rhythm', () => {
  test('title and lede keep breathing room', async ({ page }) => {
    for (const path of ['digest/', 'timeline/', 'pt/digest/']) {
      await page.goto(path);

      const title = page.locator('.page-header h1');
      const lede = page.locator('.page-header .lede');
      await expect(title).toBeVisible();
      await expect(lede).toBeVisible();

      const titleBox = await rect(title);
      const ledeBox = await rect(lede);
      expect(ledeBox.top - titleBox.bottom).toBeGreaterThanOrEqual(20);
    }
  });
});
