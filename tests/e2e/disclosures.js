// Phones start the filters and the issue rail closed; open them the way a reader would.
async function openDisclosures(page) {
  const closed = page.locator('details[data-collapse-narrow]:not([open]) > summary');
  while (await closed.count()) await closed.first().click();
}

module.exports = { openDisclosures };
