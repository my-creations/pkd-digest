'use strict';

/**
 * Locale routing — public path strings without Eleventy pathPrefix.
 * EN at `/`, PT under `/pt/`.
 */

const LOCALE_CONFIG = [
  {
    code: 'en',
    default: true,
    home: '/',
    sections: {
      home: '/',
      digest: '/digest/',
      timeline: '/timeline/',
      privacy: '/privacy/',
      terms: '/terms/',
      search: '/search/',
      archive: '/archive/',
      'start-here': '/start-here/',
      // Patient dictionary — begin
      glossary: '/glossary/',
      // Patient dictionary — end
      collections: '/collections/',
      // Lifestyle guide — begin
      lifestyle: '/lifestyle/',
      // Lifestyle guide — end
    },
  },
  {
    code: 'pt',
    default: false,
    home: '/pt/',
    sections: {
      home: '/pt/',
      digest: '/pt/digest/',
      timeline: '/pt/timeline/',
      privacy: '/pt/privacy/',
      terms: '/pt/terms/',
      search: '/pt/search/',
      archive: '/pt/archive/',
      'start-here': '/pt/start-here/',
      // Patient dictionary — begin
      glossary: '/pt/glossary/',
      // Patient dictionary — end
      collections: '/pt/collections/',
      // Lifestyle guide — begin
      lifestyle: '/pt/lifestyle/',
      // Lifestyle guide — end
    },
  },
];

const SECTION_KEYS = new Set([
  'home',
  'digest',
  'timeline',
  'privacy',
  'terms',
  'search',
  'archive',
  'start-here',
  'glossary',
  'collections',
  'lifestyle',
]);

function requireLocale(locale) {
  const config = LOCALE_CONFIG.find((entry) => entry.code === locale);
  if (!config) {
    throw new Error(`Unknown locale: ${locale}`);
  }
  return config;
}

function homeHref(locale) {
  return requireLocale(locale).home;
}

function sectionHref(locale, section) {
  if (!SECTION_KEYS.has(section)) {
    throw new Error(`Unknown section: ${section}`);
  }
  return requireLocale(locale).sections[section];
}

function otherLocale(locale) {
  return locale === 'pt' ? 'en' : 'pt';
}

/**
 * Standalone card permalink for a locale (`/digest/<slug>/` EN, `/pt/digest/<slug>/` PT).
 */
function cardHref(locale, slug) {
  requireLocale(locale);
  if (!slug || typeof slug !== 'string') {
    throw new Error(`Unknown card slug: ${slug}`);
  }
  const clean = slug.replace(/^\/+|\/+$/g, '');
  return locale === 'pt' ? `/pt/digest/${clean}/` : `/digest/${clean}/`;
}

/**
 * Map a path from one locale to the other (same section).
 * Falls back to the target locale home when the section is unknown.
 */
function languageHref(currentPath = '/', targetLocale = 'en') {
  const normalized = currentPath || '/';
  // Standalone card permalinks map to the same card in the other locale.
  const card = normalized.match(/\/digest\/([^/]+\/)\s*$/);
  if (card) {
    return cardHref(targetLocale, card[1]);
  }
  // Collection detail pages retain the same bundle when switching language.
  const bundle = normalized.match(/\/collections\/([^/]+\/)\s*$/);
  if (bundle) {
    return sectionHref(targetLocale, 'collections') + bundle[1];
  }
  let section = 'home';
  if (normalized.includes('/digest')) section = 'digest';
  else if (normalized.includes('/timeline')) section = 'timeline';
  else if (normalized.includes('/privacy')) section = 'privacy';
  else if (normalized.includes('/terms')) section = 'terms';
  else if (normalized.includes('/search')) section = 'search';
  else if (normalized.includes('/archive')) section = 'archive';
  else if (normalized.includes('/start-here')) section = 'start-here';
  // Patient dictionary — begin
  else if (normalized.includes('/glossary')) section = 'glossary';
  // Patient dictionary — end
  else if (normalized.includes('/collections')) section = 'collections';
  // Lifestyle guide — begin
  else if (normalized.includes('/lifestyle')) section = 'lifestyle';
  // Lifestyle guide — end
  return sectionHref(targetLocale, section);
}

function localePageData(locale) {
  const config = requireLocale(locale);
  return {
    locale: config.code,
    localePath: config.home,
  };
}

module.exports = {
  homeHref,
  sectionHref,
  cardHref,
  otherLocale,
  languageHref,
  localePageData,
};
