import { describe, expect, it } from 'vitest';
const { groupByIssue } = require('../../lib/issues');

const ITEMS = [
  { slug: 'a', title: 'A', date: '2026-09-08', issue: '2026-W37' },
  { slug: 'b', title: 'B', date: '2026-09-01', issue: '2026-W37' },
  { slug: 'c', title: 'C', date: '2026-08-25', issue: '2026-W36' },
  { slug: 'd', title: 'D', date: '2026-08-20' },
];

describe('issue archive grouping', () => {
  it('groups by issue in first-seen order', () => {
    const groups = groupByIssue(ITEMS);
    expect(groups.map((group) => group.issue)).toEqual(['2026-W37', '2026-W36']);
    expect(groups[0].items.map((item) => item.slug)).toEqual(['a', 'b']);
    expect(groups[1].items.map((item) => item.slug)).toEqual(['c']);
  });

  it('skips cards without an issue', () => {
    const slugs = groupByIssue(ITEMS).flatMap((group) => group.items.map((item) => item.slug));
    expect(slugs).not.toContain('d');
  });

  it('returns an empty list without items', () => {
    expect(groupByIssue([])).toEqual([]);
    expect(groupByIssue()).toEqual([]);
  });
});
