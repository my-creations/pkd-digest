'use strict';

/**
 * Related cards — plain-data helpers (unit-tested).
 * Cards are `{ slug, tags, date }`; ranking is shared-tag count, then newest first.
 */

function sharedTagCount(aTags = [], bTags = []) {
  const set = new Set(bTags || []);
  return (aTags || []).filter((tag) => set.has(tag)).length;
}

function relatedCards(items = [], current = {}, limit = 3) {
  if (!current || !current.slug) return [];
  return (items || [])
    .filter((item) => item && item.slug && item.slug !== current.slug)
    .map((item) => ({ item, score: sharedTagCount(item.tags, current.tags) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.item.date) - new Date(a.item.date))
    .slice(0, limit)
    .map((entry) => entry.item);
}

module.exports = {
  sharedTagCount,
  relatedCards,
};
