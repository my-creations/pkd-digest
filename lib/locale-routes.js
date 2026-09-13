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
    },
  },
];

const SECTION_KEYS = new Set(['home', 'digest', 'timeline', 'privacy']);

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
 * Map a path from one locale to the other (same section).
 * Falls back to the target locale home when the section is unknown.
 */
function languageHref(currentPath = '/', targetLocale = 'en') {
  const normalized = currentPath || '/';
  const section = normalized.includes('/digest')
    ? 'digest'
    : normalized.includes('/timeline')
      ? 'timeline'
      : normalized.includes('/privacy')
        ? 'privacy'
        : 'home';
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
  otherLocale,
  languageHref,
  localePageData,
};
