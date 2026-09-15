import { describe, expect, it } from 'vitest';
const { validateDocuments } = require('../../scripts/validate-content');

function card(overrides = {}) {
  return {
    file: 'example.md',
    data: {
      title: { en: 'Example finding', pt: 'Descoberta de exemplo.' },
      date: '2026-09-02',
      source: { url: 'https://example.invalid/study', name: 'Example Journal' },
      tags: ['research'],
      audience: ['patients', 'clinicians'],
      summary: { en: 'Plain-language summary.', pt: 'Resumo simples.' },
      clinicalNote: { en: 'Clinical note.', pt: 'Nota clínica.' },
      status: 'published',
      placeholder: false,
      ...overrides,
    },
  };
}

describe('content validation', () => {
  it('accepts a valid published card', () => {
    expect(validateDocuments([card()])).toEqual([]);
  });

  it('accepts placeholder cards with sample tags and an issue stamp', () => {
    const doc = card({ placeholder: true, status: 'draft', tags: ['sample'], issue: '2026-W37' });
    expect(validateDocuments([doc])).toEqual([]);
  });

  it('lets drafts keep empty Portuguese stubs for later human translation', () => {
    const { data } = card({ status: 'draft' });
    data.summary.pt = '';
    data.clinicalNote.en = '';
    data.clinicalNote.pt = '';
    expect(validateDocuments([{ file: 'draft.md', data }])).toEqual([]);
  });

  it('blocks published cards from shipping empty Portuguese stubs', () => {
    const { data } = card({ status: 'published' });
    data.title.pt = '';
    data.summary.pt = '';
    data.clinicalNote.pt = '   ';
    const errors = validateDocuments([{ file: 'pt-stub.md', data }]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('published cards need a non-empty title.pt'),
        expect.stringContaining('published cards need a non-empty summary.pt'),
        expect.stringContaining('published cards need a non-empty clinicalNote.pt'),
      ])
    );
    expect(errors.some((error) => error.includes('summary.en') || error.includes('clinicalNote.en'))).toBe(false);
  });

  it('blocks published cards with empty summaries or clinical notes in either language', () => {
    const { data } = card({ status: 'published' });
    data.summary.pt = '';
    data.clinicalNote.en = '';
    const errors = validateDocuments([{ file: 'half-done.md', data }]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('published cards need a non-empty summary.pt'),
        expect.stringContaining('published cards need a non-empty clinicalNote.en'),
      ])
    );
  });

  it('reports missing fields and invalid enums', () => {
    const { data } = card({ status: 'archived', placeholder: 'no', tags: ['gossip'], audience: ['doctors'] });
    delete data.title;
    const errors = validateDocuments([{ file: 'bad.md', data }]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('missing front matter field "title"'),
        expect.stringContaining('status must be published|draft'),
        expect.stringContaining('placeholder must be boolean'),
        expect.stringContaining('tag "gossip" is not in the locked set'),
        expect.stringContaining('audience "doctors" must be patients|clinicians'),
      ])
    );
  });

  it('requires source identity, issue shape, and dual framing', () => {
    const errors = validateDocuments([
      {
        file: 'thin.md',
        data: {
          ...card().data,
          source: { name: '' },
          issue: 'next-week',
          summary: { en: 'Only English.' },
        },
      },
    ]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('source.name is required'),
        expect.stringContaining('source.url is required'),
        expect.stringContaining('issue must match YYYY-Www'),
        expect.stringContaining('summary and clinicalNote must each include en and pt strings'),
      ])
    );
  });
});
