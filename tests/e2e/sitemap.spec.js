const { test, expect } = require('@playwright/test');

const ORIGIN = 'https://my-creations.github.io';
const ROUTES = [
  '/pkd-digest/',
  '/pkd-digest/digest/',
  '/pkd-digest/pt/',
  '/pkd-digest/pt/digest/',
  '/pkd-digest/timeline/',
  '/pkd-digest/pt/timeline/',
  '/pkd-digest/privacy/',
  '/pkd-digest/pt/privacy/',
  '/pkd-digest/terms/',
  '/pkd-digest/pt/terms/',
];

test.describe('sitemap', () => {
  test('lists every public route with absolute URLs', async ({ request }) => {
    const res = await request.get('sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();
    for (const route of ROUTES) {
      expect(xml).toContain(`<loc>${ORIGIN}${route}</loc>`);
    }
  });

  test('cross-links EN/PT alternates', async ({ request }) => {
    const res = await request.get('sitemap.xml');
    const xml = await res.text();
    expect(xml).toContain('hreflang="en"');
    expect(xml).toContain('hreflang="pt"');
  });
});
