const { test, expect } = require('@playwright/test');

test.describe('content security policy', () => {
  for (const path of ['./', 'digest/', 'search/', 'start-here/', 'pt/start-here/']) {
    test(`${path} declares a CSP and nothing on it violates the policy`, async ({ page }) => {
      const violations = [];
      page.on('console', (msg) => {
        if (/Content[- ]Security[- ]Policy/i.test(msg.text())) violations.push(msg.text());
      });
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          console.error(`Content-Security-Policy violation: ${event.violatedDirective} ${event.blockedURI}`);
        });
      });
      await page.goto(path);
      await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);

      if (path.endsWith('start-here/')) {
        // Exercise the lazy three.js import and the canvas cursor styles.
        await page.locator('[data-kidney3d]').scrollIntoViewIfNeeded();
        await expect(page.locator('[data-kidney3d-status]')).not.toHaveText('', { timeout: 15000 });
        await page.waitForTimeout(500);
      }
      if (path === 'search/') {
        await page.locator('#search-input').fill('kidney');
        await expect(page.locator('[data-search-results] li').first()).toBeVisible();
      }
      expect(violations).toEqual([]);
    });
  }
});
