'use strict';

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const ITEMS_DIR = path.join(__dirname, '..', 'src', 'content', 'items');
const REQUIRED = ['title', 'date', 'source', 'tags', 'audience', 'summary', 'clinicalNote', 'status', 'placeholder'];
const STATUSES = new Set(['published', 'draft']);
const LOCKED_TAGS = new Set(['research', 'treatment', 'lifestyle', 'advocacy']);
const PLACEHOLDER_TAGS = new Set(['sample', 'placeholder']);
const LOCKED_AUDIENCE = new Set(['patients', 'clinicians']);
const ISSUE_RE = /^\d{4}-W\d{2}$/;

function fail(message) {
  console.error(`validate:content — ${message}`);
  process.exitCode = 1;
}

function isLocalePair(value) {
  return value && typeof value === 'object' && typeof value.en === 'string' && typeof value.pt === 'string';
}

if (!fs.existsSync(ITEMS_DIR)) {
  console.log('validate:content — no items directory yet (ok)');
  process.exit(0);
}

const files = fs.readdirSync(ITEMS_DIR).filter((name) => name.endsWith('.md'));

if (files.length === 0) {
  fail('expected at least one content card under src/content/items/');
}

for (const file of files) {
  const fullPath = path.join(ITEMS_DIR, file);
  const { data } = matter(fs.readFileSync(fullPath, 'utf8'));

  for (const key of REQUIRED) {
    if (!(key in data)) {
      fail(`${file}: missing front matter field "${key}"`);
    }
  }

  if (!STATUSES.has(data.status)) {
    fail(`${file}: status must be published|draft (got ${data.status})`);
  }

  if (typeof data.placeholder !== 'boolean') {
    fail(`${file}: placeholder must be boolean`);
  }

  if (!data.source || typeof data.source !== 'object' || !data.source.name) {
    fail(`${file}: source.name is required`);
  }

  if (!data.source.url || typeof data.source.url !== 'string') {
    fail(`${file}: source.url is required`);
  }

  if (!Array.isArray(data.tags) || !Array.isArray(data.audience)) {
    fail(`${file}: tags and audience must be arrays`);
  }

  const allowedTags = data.placeholder ? new Set([...LOCKED_TAGS, ...PLACEHOLDER_TAGS]) : LOCKED_TAGS;
  for (const tag of data.tags) {
    if (!allowedTags.has(tag)) {
      fail(`${file}: tag "${tag}" is not in the locked set`);
    }
  }

  for (const audience of data.audience) {
    if (!LOCKED_AUDIENCE.has(audience)) {
      fail(`${file}: audience "${audience}" must be patients|clinicians`);
    }
  }

  if (data.issue != null) {
    if (typeof data.issue !== 'string' || !ISSUE_RE.test(data.issue)) {
      fail(`${file}: issue must match YYYY-Www (got ${data.issue})`);
    }
  }

  if (!isLocalePair(data.summary) || !isLocalePair(data.clinicalNote)) {
    fail(`${file}: summary and clinicalNote must each include en and pt strings`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(`validate:content — ok (${files.length} card${files.length === 1 ? '' : 's'})`);
