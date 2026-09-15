import { describe, expect, it } from 'vitest';
const i18n = require('../../src/_data/i18n');

function keyPaths(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }
  return Object.keys(value)
    .sort()
    .flatMap((key) => keyPaths(value[key], prefix ? `${prefix}.${key}` : key));
}

describe('i18n parity', () => {
  it('exposes identical key trees for en and pt', () => {
    expect(keyPaths(i18n.pt)).toEqual(keyPaths(i18n.en));
  });

  it('keeps digest rail copy non-empty in both locales', () => {
    for (const locale of ['en', 'pt']) {
      expect(i18n[locale].digest.inThisIssue).toMatch(/\S/);
      expect(i18n[locale].digest.leadStory).toMatch(/\S/);
    }
  });
});
