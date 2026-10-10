const { test, expect } = require('@playwright/test');
const i18n = require('../../src/_data/i18n');

for (const locale of ['en', 'pt']) {
  const prefix = locale === 'pt' ? 'pt/' : '';
  const copy = i18n[locale].home;

  test(`${locale} start-here shows the 3D kidney section with working controls`, async ({ page }) => {
    await page.goto(`${prefix}start-here/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);

    const section = page.locator('[data-kidney3d]');
    await expect(section).toBeVisible();
    await expect(page.locator('#kidney3d-heading')).toHaveText(copy.kidneyTitle);
    await expect(page.locator('#kidney3d-heading + .lede')).toHaveText(copy.kidneyLede);

    const external = section.getByRole('button', { name: copy.kidneyViewExternal });
    const crossSection = section.getByRole('button', { name: copy.kidneyViewSection });
    const healthy = section.getByRole('button', { name: copy.kidneyModeHealthy });
    const cystic = section.getByRole('button', { name: copy.kidneyModeCystic });

    await expect(external).toHaveAttribute('aria-pressed', 'true');
    await expect(healthy).toHaveAttribute('aria-pressed', 'true');

    await cystic.click();
    await expect(cystic).toHaveAttribute('aria-pressed', 'true');
    await expect(cystic).toHaveClass(/is-active/);
    await expect(healthy).toHaveAttribute('aria-pressed', 'false');

    await crossSection.click();
    await expect(crossSection).toHaveAttribute('aria-pressed', 'true');
    await expect(external).toHaveAttribute('aria-pressed', 'false');

    const slider = section.locator('[data-kidney3d-severity]');
    await expect(slider).toBeVisible();
    await slider.fill('5');
    await expect(slider).toHaveValue('5');
    await expect(section.locator('[data-kidney3d-severity-value]')).toHaveText('5');

    await expect(section.locator('.kidney3d__table tbody tr')).toHaveCount(8);
    await expect(section.locator('.kidney3d__table .kidney3d__swatch')).toHaveCount(8);
    await section.getByRole('button', { name: copy.kidneyCortex }).click();
    await expect(section.locator('[data-kidney3d-status]')).toHaveText(copy.kidneyCortex);

    // Focusing a hidden structure switches to the view where it is visible.
    await external.click();
    await healthy.click();
    await expect(slider).toBeDisabled();
    await section.getByRole('button', { name: copy.kidneyMedulla }).click();
    await expect(crossSection).toHaveAttribute('aria-pressed', 'true');
    await external.click();
    await section.getByRole('button', { name: copy.kidneyCalyx }).click();
    await expect(crossSection).toHaveAttribute('aria-pressed', 'true');
    await expect(section.locator('[data-kidney3d-status]')).toHaveText(copy.kidneyCalyx);
    await section.getByRole('button', { name: copy.kidneyCyst }).click();
    await expect(cystic).toHaveAttribute('aria-pressed', 'true');

    await expect(page.locator('script[type="module"][src$="/js/kidney3d.js"]')).toHaveCount(1);
  });
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('start-here shows a single static kidney illustration', async ({ page }) => {
    await page.goto('start-here/');
    const section = page.locator('[data-kidney3d]');
    await expect(section.locator('.kidney3d__svg')).toHaveCount(1);
    await expect(section.locator('.kidney3d__svg')).toBeVisible();
    await expect(section.locator('[data-kidney3d-hint]')).toBeHidden();
  });
});

test('the 3D kidney auto-spin stops after a few seconds', async ({ page }) => {
  // Paused fake clock: rAF and performance.now advance only on runFor, so
  // load time on a busy machine cannot eat into the 5 s window.
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('start-here/');
  const canvas = page.locator('[data-kidney3d-canvas]');
  await canvas.scrollIntoViewIfNeeded();
  const ready = await canvas
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!ready, 'WebGL unavailable in this browser; the static fallback is covered above');

  // fastForward jumps time, then a short runFor lets a few frames tick, so the
  // software WebGL renderer draws a handful of frames instead of hundreds.
  await page.clock.runFor(100);
  await expect(canvas).toHaveAttribute('data-spinning', 'true');
  await page.clock.fastForward(4000);
  await page.clock.runFor(50);
  await expect(canvas).toHaveAttribute('data-spinning', 'true');
  await page.clock.fastForward(1500);
  await page.clock.runFor(50);
  await expect(canvas).toHaveAttribute('data-spinning', 'false');
});
