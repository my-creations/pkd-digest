'use strict';

/**
 * Card filters (progressive enhancement).
 * Each [data-filters] bar controls [data-filterable] cards in the same <main>:
 * single-select tag + audience groups, rail sync via data-filter-index, live count.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-filters]').forEach(initFilters);
});

function initFilters(root) {
  const scope = root.closest('main') || document;
  const cards = Array.from(scope.querySelectorAll('[data-filterable]'));
  if (cards.length === 0) return;
  const railItems = Array.from(scope.querySelectorAll('[data-rail-item]'));
  const count = root.querySelector('[data-filters-count]');
  const emptyNote = scope.querySelector('[data-filters-empty]');
  const groups = Array.from(root.querySelectorAll('[data-filter-group]'));
  const state = {};
  groups.forEach((group) => {
    state[group.dataset.filterGroup] = 'all';
  });

  function messageFor(n) {
    if (n === 0) return root.dataset.msgNone || '';
    if (n === 1) return root.dataset.msgOne || '';
    return (root.dataset.msgMany || '').replace('{n}', String(n));
  }

  function apply() {
    let visible = 0;
    cards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(' ').filter(Boolean);
      const audiences = (card.dataset.audience || '').split(' ').filter(Boolean);
      const tagOk = state.tag === 'all' || tags.includes(state.tag);
      const audienceOk = state.audience === 'all' || audiences.includes(state.audience);
      const show = tagOk && audienceOk;
      card.hidden = !show;
      if (show) visible += 1;
      const index = card.dataset.filterIndex;
      if (index) {
        railItems
          .filter((item) => item.dataset.railItem === index)
          .forEach((item) => {
            item.hidden = !show;
          });
      }
    });
    if (count) count.textContent = messageFor(visible);
    if (emptyNote) emptyNote.hidden = visible !== 0;
  }

  function select(group, value) {
    state[group.dataset.filterGroup] = value;
    group.querySelectorAll('[data-filter-value]').forEach((button) => {
      const active = button.dataset.filterValue === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  root.addEventListener('click', (event) => {
    const valueButton = event.target.closest('[data-filter-value]');
    if (valueButton) {
      const group = valueButton.closest('[data-filter-group]');
      if (group) {
        select(group, valueButton.dataset.filterValue);
        apply();
      }
      return;
    }
    if (event.target.closest('[data-filters-reset]')) {
      groups.forEach((group) => select(group, 'all'));
      apply();
    }
  });

  apply();
}
