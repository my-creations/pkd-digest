'use strict';

/**
 * Weekly issue archive — plain-data helpers (unit-tested).
 * Groups cards by `issue`, preserving first-seen order (newest first when fed
 * date-descending collections). Cards are `{ slug, title, date, issue }`.
 */

function groupByIssue(items = []) {
  const groups = new Map();
  for (const item of items || []) {
    const issue = item && item.issue;
    if (!issue) continue;
    if (!groups.has(issue)) groups.set(issue, []);
    groups.get(issue).push(item);
  }
  return [...groups.entries()]
    .map(([issue, members]) => ({ issue, items: members }))
    .sort((a, b) => (a.issue < b.issue ? 1 : a.issue > b.issue ? -1 : 0));
}

module.exports = {
  groupByIssue,
};
