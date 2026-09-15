const { homeHref, sectionHref, cardHref, languageHref, otherLocale } = require('./lib/locale-routes');
const { relatedCards } = require('./lib/related-cards');

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    'src/css': 'css',
    'src/js': 'js',
    'src/assets/favicons': 'assets/favicons',
    'src/assets/og-default.png': 'assets/og-default.png',
  });

  eleventyConfig.addWatchTarget('src/css/');
  eleventyConfig.addWatchTarget('src/assets/');

  eleventyConfig.addFilter('isoDate', (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter('toRfc3339', (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  });

  eleventyConfig.addFilter('displayDate', (value, locale = 'en') => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  });

  eleventyConfig.addFilter('homeHref', (locale) => homeHref(locale));
  eleventyConfig.addFilter('sectionHref', (locale, section) => sectionHref(locale, section));
  eleventyConfig.addFilter('cardHref', (locale, slug) => cardHref(locale, slug));
  eleventyConfig.addFilter('relatedCards', (items = [], card, limit = 3) =>
    relatedCards(
      items.map((item) => ({
        slug: item.fileSlug,
        title: item.data.title,
        tags: item.data.tags || [],
        date: item.date,
      })),
      { slug: card.fileSlug, tags: (card.data && card.data.tags) || [], date: card.date },
      limit
    )
  );
  eleventyConfig.addFilter('otherLocale', (locale) => otherLocale(locale));
  eleventyConfig.addFilter('languageHref', (currentPath, targetLocale) => languageHref(currentPath, targetLocale));

  eleventyConfig.addFilter('localized', (obj, locale = 'en') => {
    if (!obj || typeof obj !== 'object') return obj ?? '';
    return obj[locale] ?? obj.en ?? '';
  });

  eleventyConfig.addFilter('findByTranslationKey', (collection = [], key, locale) =>
    collection.find((item) => item.data.translationKey === key && item.data.locale === locale)
  );

  function isPublicItem(item) {
    return item.data.status === 'published' && item.data.placeholder !== true;
  }

  eleventyConfig.addCollection('digestItems', (collectionApi) =>
    collectionApi.getFilteredByGlob('src/content/items/*.md').sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection('publishedItems', (collectionApi) =>
    collectionApi
      .getFilteredByGlob('src/content/items/*.md')
      .filter(isPublicItem)
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection('latestIssueItems', (collectionApi) => {
    const items = collectionApi
      .getFilteredByGlob('src/content/items/*.md')
      .filter(isPublicItem)
      .sort((a, b) => b.date - a.date);
    const withIssue = items.filter((item) => typeof item.data.issue === 'string' && item.data.issue);
    if (withIssue.length === 0) return items;
    const latestIssue = withIssue[0].data.issue;
    return withIssue.filter((item) => item.data.issue === latestIssue).sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || '/pkd-digest/',
    templateFormats: ['njk', 'md', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
  };
};
