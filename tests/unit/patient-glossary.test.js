import { describe, expect, it } from 'vitest';
const patientGlossary = require('../../src/_data/patientGlossary');
const { rules } = require('../../curation/glossary.json');
const { sectionHref, languageHref } = require('../../lib/locale-routes');

describe('patientGlossary reader definitions', () => {
  it('has 12–16 unique, stable term ids and complete plain-language translations', () => {
    expect(patientGlossary.length).toBeGreaterThanOrEqual(12);
    expect(patientGlossary.length).toBeLessThanOrEqual(16);
    expect(new Set(patientGlossary.map((entry) => entry.id)).size).toBe(patientGlossary.length);
    for (const entry of patientGlossary) {
      expect(entry.id).toMatch(/^[a-z][a-z0-9-]*$/);
      for (const field of ['term', 'shortDef']) {
        for (const locale of ['en', 'pt']) {
          expect(typeof entry[field][locale]).toBe('string');
          expect(entry[field][locale].trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps all Portuguese reader text within the editorial vocabulary rules', () => {
    for (const entry of patientGlossary) {
      for (const rule of rules.filter((rule) => rule.locales.includes('pt'))) {
        const pattern = new RegExp(rule.pattern, rule.flags || 'i');
        expect(entry.term.pt, `${entry.id}: ${rule.id}`).not.toMatch(pattern);
        expect(entry.shortDef.pt, `${entry.id}: ${rule.id}`).not.toMatch(pattern);
      }
    }
    expect(patientGlossary.find((entry) => entry.id === 'guideline').term.pt).toBe('Orientação de prática clínica');
    expect(patientGlossary.find((entry) => entry.id === 'transplant').shortDef.pt).toContain('seguimento');
  });

  it('registers glossary routes and switches to the same page across locales', () => {
    expect(sectionHref('en', 'glossary')).toBe('/glossary/');
    expect(sectionHref('pt', 'glossary')).toBe('/pt/glossary/');
    expect(languageHref('/glossary/', 'pt')).toBe('/pt/glossary/');
    expect(languageHref('/pt/glossary/', 'en')).toBe('/glossary/');
    expect(languageHref('/pkd-digest/pt/glossary/', 'en')).toBe('/glossary/');
  });
});
