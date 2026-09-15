const { test, expect } = require('@playwright/test');

test.describe('atom feed', () => {
  test('serves an EN feed with one entry per latest-issue card', async ({ request }) => {
    const res = await request.get('feed.xml');
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();

    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<link href="https://my-creations.github.io/pkd-digest/digest/" />');
    expect(xml).toContain('KDOQI US Commentary');
    expect(xml).toContain('/digest/#digest-item-1');
    expect(xml).toMatch(/<updated>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const entries = xml.match(/<entry>/g) || [];
    expect(entries.length).toBeGreaterThan(0);
  });

  test('serves a PT feed with translated titles', async ({ request }) => {
    const res = await request.get('pt/feed.xml');
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();

    expect(xml).toContain('<link href="https://my-creations.github.io/pkd-digest/pt/digest/" />');
    expect(xml).toContain('Comentário KDOQI');

    const enRes = await request.get('feed.xml');
    const enEntries = (await enRes.text()).match(/<entry>/g) || [];
    const ptEntries = xml.match(/<entry>/g) || [];
    expect(ptEntries.length).toBe(enEntries.length);
  });

  test('digest pages advertise feed autodiscovery', async ({ page }) => {
    await page.goto('digest/');
    await expect(page.locator('link[type="application/atom+xml"]')).toHaveAttribute(
      'href',
      'https://my-creations.github.io/pkd-digest/feed.xml'
    );

    await page.goto('pt/digest/');
    await expect(page.locator('link[type="application/atom+xml"]')).toHaveAttribute(
      'href',
      'https://my-creations.github.io/pkd-digest/pt/feed.xml'
    );
  });
});
