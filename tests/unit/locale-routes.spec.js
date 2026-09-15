const { test, expect } = require('@playwright/test');
const routes = require('../../lib/locale-routes');

test.describe('locale routes', () => {
  test('resolves home paths per locale', () => {
    expect(routes.homeHref('en')).toBe('/');
    expect(routes.homeHref('pt')).toBe('/pt/');
  });

  test('resolves section paths per locale', () => {
    expect(routes.sectionHref('en', 'digest')).toBe('/digest/');
    expect(routes.sectionHref('pt', 'digest')).toBe('/pt/digest/');
    expect(routes.sectionHref('en', 'timeline')).toBe('/timeline/');
    expect(routes.sectionHref('pt', 'timeline')).toBe('/pt/timeline/');
  });

  test('maps the current section across locales', () => {
    expect(routes.languageHref('/digest/', 'pt')).toBe('/pt/digest/');
    expect(routes.languageHref('/pt/digest/', 'en')).toBe('/digest/');
    expect(routes.languageHref('/timeline/', 'pt')).toBe('/pt/timeline/');
  });

  test('falls back to locale home for unknown sections', () => {
    expect(routes.languageHref('/unknown-section/', 'pt')).toBe('/pt/');
    expect(routes.languageHref('/', 'en')).toBe('/');
  });

  test('rejects unknown locales and sections', () => {
    expect(() => routes.homeHref('es')).toThrow('Unknown locale: es');
    expect(() => routes.sectionHref('en', 'newsletter')).toThrow('Unknown section: newsletter');
  });
});
