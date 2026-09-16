'use strict';

/**
 * Client-side card search (progressive enhancement).
 * Each [data-search] section fetches its locale JSON index once, then matches
 * as-you-type across title, summary, clinical note, visit question, and tags. Accent-insensitive.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-search]').forEach(initSearch);
});

function normalize(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function cardText(card) {
  return normalize(
    [card.title, card.summary, card.clinicalNote, card.visitQuestion, (card.tags || []).join(' ')].join('\n')
  );
}

function cardUrl(locale, slug) {
  const clean = String(slug || '').replace(/^\/+|\/+$/g, '');
  return locale === 'pt' ? `/pt/digest/${clean}/` : `/digest/${clean}/`;
}

async function initSearch(root) {
  const input = root.querySelector('input[type="search"]');
  const status = root.querySelector('[data-search-status]');
  const results = root.querySelector('[data-search-results]');
  if (!input || !status || !results) return;
  const locale = root.dataset.locale || 'en';

  let index = null;
  try {
    const response = await fetch(root.dataset.indexUrl);
    if (!response.ok) return;
    index = await response.json();
  } catch {
    return;
  }
  if (!Array.isArray(index)) return;

  function messageFor(n) {
    if (n === 0) return root.dataset.msgNone || '';
    if (n === 1) return root.dataset.msgOne || '';
    return (root.dataset.msgMany || '').replace('{n}', String(n));
  }

  function render(matches) {
    results.textContent = '';
    matches.forEach((card) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = cardUrl(locale, card.slug);
      link.textContent = card.title;
      item.appendChild(link);
      results.appendChild(item);
    });
    status.textContent = messageFor(matches.length);
  }

  input.addEventListener('input', () => {
    const query = normalize(input.value.trim());
    if (query.length < 2) {
      results.textContent = '';
      status.textContent = root.dataset.msgHint || '';
      return;
    }
    const matches = index
      .map((card) => {
        const text = cardText(card);
        const title = normalize(card.title);
        const score = title.includes(query) ? 2 : text.includes(query) ? 1 : 0;
        return { card, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.card);
    render(matches);
  });
}
