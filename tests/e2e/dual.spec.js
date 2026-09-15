const { test, expect } = require('@playwright/test');

test.describe('dual framing toggle', () => {
  test('digest defaults to plain language and switches to clinical', async ({ page }) => {
    await page.goto('digest/');

    const lead = page.locator('.digest-lead');
    await expect(lead.locator('[data-dual-panel="plain"]')).toBeVisible();
    await expect(lead.locator('[data-dual-panel="clinical"]')).toBeHidden();
    await expect(lead.locator('[data-dual-view="plain"]')).toHaveAttribute('aria-pressed', 'true');

    await lead.locator('[data-dual-view="clinical"]').click();
    await expect(lead.locator('[data-dual-panel="plain"]')).toBeHidden();
    await expect(lead.locator('[data-dual-panel="clinical"]')).toBeVisible();
    const plainText = await lead.locator('[data-dual-panel="plain"]').textContent();
    const clinicalText = await lead.locator('[data-dual-panel="clinical"]').textContent();
    expect(clinicalText.trim().length).toBeGreaterThan(0);
    expect(clinicalText).not.toBe(plainText);
    await expect(lead.locator('[data-dual-view="clinical"]')).toHaveAttribute('aria-pressed', 'true');

    await lead.locator('[data-dual-view="plain"]').click();
    await expect(lead.locator('[data-dual-panel="plain"]')).toBeVisible();
  });

  test('every river article carries an independent toggle', async ({ page }) => {
    await page.goto('digest/');

    const articles = page.locator('.digest-river article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(1);
    expect(await page.locator('.digest-river [data-dual]').count()).toBe(count);

    // Toggling the second article leaves the lead untouched.
    const second = articles.nth(1);
    await second.locator('[data-dual-view="clinical"]').click();
    await expect(second.locator('[data-dual-panel="clinical"]')).toBeVisible();
    await expect(page.locator('.digest-lead [data-dual-panel="plain"]')).toBeVisible();
  });

  test('toggle works in Portuguese with localized switch labels', async ({ page }) => {
    await page.goto('pt/digest/');

    const lead = page.locator('.digest-lead');
    await expect(lead.locator('[data-dual-view="plain"]')).toContainText('Linguagem simples');
    await expect(lead.locator('[data-dual-view="clinical"]')).toContainText('Nota clínica');

    await lead.locator('[data-dual-view="clinical"]').click();
    await expect(lead.locator('[data-dual-panel="clinical"]')).toBeVisible();
    const clinicalText = await lead.locator('[data-dual-panel="clinical"]').textContent();
    expect(clinicalText.trim().length).toBeGreaterThan(0);
  });

  test('timeline cards toggle between framings', async ({ page }) => {
    await page.goto('timeline/');

    const card = page.locator('.timeline-list [data-dual]').first();
    await expect(card.locator('[data-dual-panel="plain"]')).toBeVisible();
    await card.locator('[data-dual-view="clinical"]').click();
    await expect(card.locator('[data-dual-panel="plain"]')).toBeHidden();
    await expect(card.locator('[data-dual-panel="clinical"]')).toBeVisible();
  });

  test('standalone card pages toggle between framings', async ({ page }) => {
    await page.goto('digest/kdoqi-us-commentary-kdigo-2025-adpkd-guideline-2026/');

    const card = page.locator('.item-card--standalone');
    await card.locator('[data-dual-view="clinical"]').click();
    await expect(card.locator('[data-dual-panel="clinical"]')).toBeVisible();
    await expect(card.locator('[data-dual-panel="clinical"]')).toContainText('KDOQI society commentary');
  });
});
