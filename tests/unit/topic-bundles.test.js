import { describe, expect, it } from 'vitest';
const path = require('node:path');
const matter = require('gray-matter');
const bundles = require('../../src/_data/topicBundles');
const i18n = require('../../src/_data/i18n');
const glossary = require('../../curation/glossary.json');
const { languageHref, sectionHref } = require('../../lib/locale-routes');

describe('topicBundles', () => {
  it('contains exactly the three approved, uniquely named collections', () => {
    expect(bundles.map((bundle) => bundle.slug)).toEqual(['pregnancy', 'vascular-risk', 'polycystic-liver']);
  });

  for (const bundle of bundles) {
    it(`${bundle.slug} references only existing published non-placeholder cards`, () => {
      expect(bundle.cardSlugs.length).toBeGreaterThan(0);
      expect(new Set(bundle.cardSlugs).size).toBe(bundle.cardSlugs.length);
      for (const slug of bundle.cardSlugs) {
        const { data } = matter.read(path.join(__dirname, '../../src/content/items', `${slug}.md`));
        expect(data.status).toBe('published');
        expect(data.placeholder).toBe(false);
      }
    });

    it(`${bundle.slug} switches locale without losing the collection`, () => {
      for (const locale of ['en', 'pt']) {
        const target = `${sectionHref(locale, 'collections')}${bundle.slug}/`;
        expect(languageHref(`/collections/${bundle.slug}/`, locale)).toBe(target);
        expect(languageHref(`/pt/collections/${bundle.slug}/`, locale)).toBe(target);
      }
    });
  }

  it('has complete bilingual copy that obeys the terminology gate', () => {
    for (const locale of ['en', 'pt']) {
      const texts = [
        ...Object.values(i18n[locale].topicBundles),
        ...bundles.flatMap((bundle) => [bundle.title[locale], bundle.lede[locale]]),
      ];
      for (const text of texts) {
        expect(typeof text).toBe('string');
        expect(text.trim().length).toBeGreaterThan(0);
        for (const rule of glossary.rules.filter((rule) => rule.locales.includes(locale))) {
          expect(text).not.toMatch(new RegExp(rule.pattern, rule.flags || 'i'));
        }
      }
      expect(languageHref('/collections/', locale)).toBe(sectionHref(locale, 'collections'));
      expect(languageHref('/pt/collections/', locale)).toBe(sectionHref(locale, 'collections'));
    }
  });
});
