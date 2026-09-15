import { describe, expect, it } from 'vitest';
const routes = require('../../lib/locale-routes');

describe('locale routes', () => {
  it('resolves home paths per locale', () => {
    expect(routes.homeHref('en')).toBe('/');
    expect(routes.homeHref('pt')).toBe('/pt/');
  });

  it('resolves section paths per locale', () => {
    expect(routes.sectionHref('en', 'digest')).toBe('/digest/');
    expect(routes.sectionHref('pt', 'digest')).toBe('/pt/digest/');
    expect(routes.sectionHref('en', 'timeline')).toBe('/timeline/');
    expect(routes.sectionHref('pt', 'timeline')).toBe('/pt/timeline/');
    expect(routes.sectionHref('en', 'search')).toBe('/search/');
    expect(routes.sectionHref('pt', 'search')).toBe('/pt/search/');
  });

  it('maps the current section across locales', () => {
    expect(routes.languageHref('/digest/', 'pt')).toBe('/pt/digest/');
    expect(routes.languageHref('/pt/digest/', 'en')).toBe('/digest/');
    expect(routes.languageHref('/timeline/', 'pt')).toBe('/pt/timeline/');
    expect(routes.languageHref('/search/', 'pt')).toBe('/pt/search/');
    expect(routes.languageHref('/pt/search/', 'en')).toBe('/search/');
  });

  it('resolves standalone card permalinks per locale', () => {
    expect(routes.cardHref('en', 'my-card')).toBe('/digest/my-card/');
    expect(routes.cardHref('pt', 'my-card')).toBe('/pt/digest/my-card/');
  });

  it('maps card permalinks to the same card across locales', () => {
    expect(routes.languageHref('/digest/my-card/', 'pt')).toBe('/pt/digest/my-card/');
    expect(routes.languageHref('/pt/digest/my-card/', 'en')).toBe('/digest/my-card/');
    expect(routes.languageHref('/pkd-digest/digest/my-card/', 'pt')).toBe('/pt/digest/my-card/');
  });

  it('rejects unknown card slugs', () => {
    expect(() => routes.cardHref('en', '')).toThrow('Unknown card slug');
    expect(() => routes.cardHref('es', 'my-card')).toThrow('Unknown locale: es');
  });

  it('falls back to locale home for unknown sections', () => {
    expect(routes.languageHref('/unknown-section/', 'pt')).toBe('/pt/');
    expect(routes.languageHref('/', 'en')).toBe('/');
  });

  it('rejects unknown locales and sections', () => {
    expect(() => routes.homeHref('es')).toThrow('Unknown locale: es');
    expect(() => routes.sectionHref('en', 'newsletter')).toThrow('Unknown section: newsletter');
  });
});
