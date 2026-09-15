import { describe, expect, it } from 'vitest';
const { sharedTagCount, relatedCards } = require('../../lib/related-cards');

const CARDS = [
  { slug: 'a', tags: ['research', 'advocacy'], date: '2026-09-01' },
  { slug: 'b', tags: ['research'], date: '2026-09-08' },
  { slug: 'c', tags: ['treatment'], date: '2026-09-10' },
  { slug: 'd', tags: ['research', 'advocacy'], date: '2026-08-01' },
];

describe('related cards', () => {
  it('counts shared tags', () => {
    expect(sharedTagCount(['research', 'advocacy'], ['research'])).toBe(1);
    expect(sharedTagCount(['treatment'], ['research'])).toBe(0);
    expect(sharedTagCount([], ['research'])).toBe(0);
  });

  it('excludes the current card and ranks by shared tags', () => {
    const related = relatedCards(CARDS, CARDS[0], 3);
    expect(related.map((card) => card.slug)).toEqual(['d', 'b']);
  });

  it('breaks score ties by newest date', () => {
    const tied = [
      { slug: 'old', tags: ['research'], date: '2026-08-01' },
      { slug: 'new', tags: ['research'], date: '2026-09-01' },
    ];
    expect(relatedCards(tied, { slug: 'self', tags: ['research'] }, 3)).toEqual([tied[1], tied[0]]);
  });

  it('returns nothing without a current slug or shared tags', () => {
    expect(relatedCards(CARDS, {}, 3)).toEqual([]);
    expect(relatedCards(CARDS, { slug: 'x', tags: ['lifestyle'] }, 3)).toEqual([]);
  });

  it('defaults to three results', () => {
    const many = Array.from({ length: 6 }, (_, index) => ({
      slug: `card-${index}`,
      tags: ['research'],
      date: '2026-09-01',
    }));
    expect(relatedCards(many, { slug: 'self', tags: ['research'] })).toHaveLength(3);
  });
});
