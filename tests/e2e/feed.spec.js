const { test, expect } = require('@playwright/test');

test.describe('atom feed', () => {
  test('serves an EN feed with one entry per latest-issue card', async ({ request, page }) => {
    const res = await request.get('feed.xml');
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();

    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<link href="https://my-creations.github.io/pkd-digest/digest/" />');
    expect(xml).toMatch(/<updated>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Entries mirror the digest's latest issue, linking to EN card permalinks.
    await page.goto('digest/');
    const cardCount = await page.locator('.digest-river article').count();
    const entries = xml.match(/<entry>/g) || [];
    expect(cardCount).toBeGreaterThan(0);
    expect(entries.length).toBe(cardCount);
    const entryLinks = xml.match(/<link href="[^"]+\/pkd-digest\/digest\/[^"]+\/" \/>/g) || [];
    expect(entryLinks.length).toBe(cardCount);

    // Atom type="html" content must be escaped text, not child elements.
    expect(xml).toContain('<content type="html">&lt;p&gt;');
    expect(xml).not.toMatch(/<content type="html"><p>/);
  });

  test('serves a PT feed with translated titles', async ({ request }) => {
    const res = await request.get('pt/feed.xml');
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();

    expect(xml).toContain('<link href="https://my-creations.github.io/pkd-digest/pt/digest/" />');
    expect(xml).toContain('/pkd-digest/pt/digest/');

    const enRes = await request.get('feed.xml');
    const enXml = await enRes.text();
    const enEntries = enXml.match(/<entry>/g) || [];
    const ptEntries = xml.match(/<entry>/g) || [];
    expect(ptEntries.length).toBe(enEntries.length);

    // Every entry title is a real translation, not a copy of the EN title.
    const titles = (feed) => [...feed.matchAll(/<entry>\s*<title>([^<]*)<\/title>/g)].map((match) => match[1]);
    const enTitles = titles(enXml);
    const ptTitles = titles(xml);
    expect(ptTitles.length).toBe(enTitles.length);
    ptTitles.forEach((title, index) => expect(title).not.toBe(enTitles[index]));
  });

  test('excludes drafts and placeholders from both feeds', async ({ request }) => {
    for (const path of ['feed.xml', 'pt/feed.xml']) {
      const res = await request.get(path);
      expect(res.ok()).toBeTruthy();
      const xml = await res.text();
      expect(xml).not.toContain('sample-placeholder');
      expect(xml).not.toContain('status: draft');
    }
  });

  test('keeps feeds out of the sitemap', async ({ request }) => {
    const res = await request.get('sitemap.xml');
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).not.toContain('feed.xml');
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
