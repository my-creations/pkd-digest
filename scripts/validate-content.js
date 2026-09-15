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

function isLocalePair(value) {
  return value && typeof value === 'object' && typeof value.en === 'string' && typeof value.pt === 'string';
}

function validateDocuments(documents) {
  const errors = [];

  for (const { file, data } of documents) {
    for (const key of REQUIRED) {
      if (!(key in data)) {
        errors.push(`${file}: missing front matter field "${key}"`);
      }
    }

    if (!STATUSES.has(data.status)) {
      errors.push(`${file}: status must be published|draft (got ${data.status})`);
    }

    if (typeof data.placeholder !== 'boolean') {
      errors.push(`${file}: placeholder must be boolean`);
    }

    if (!data.source || typeof data.source !== 'object' || !data.source.name) {
      errors.push(`${file}: source.name is required`);
    }

    if (!data.source || !data.source.url || typeof data.source.url !== 'string') {
      errors.push(`${file}: source.url is required`);
    }

    if (!Array.isArray(data.tags) || !Array.isArray(data.audience)) {
      errors.push(`${file}: tags and audience must be arrays`);
    } else {
      const allowedTags = data.placeholder ? new Set([...LOCKED_TAGS, ...PLACEHOLDER_TAGS]) : LOCKED_TAGS;
      for (const tag of data.tags) {
        if (!allowedTags.has(tag)) {
          errors.push(`${file}: tag "${tag}" is not in the locked set`);
        }
      }

      for (const audience of data.audience) {
        if (!LOCKED_AUDIENCE.has(audience)) {
          errors.push(`${file}: audience "${audience}" must be patients|clinicians`);
        }
      }
    }

    if (data.issue != null) {
      if (typeof data.issue !== 'string' || !ISSUE_RE.test(data.issue)) {
        errors.push(`${file}: issue must match YYYY-Www (got ${data.issue})`);
      }
    }

    if (!isLocalePair(data.summary) || !isLocalePair(data.clinicalNote)) {
      errors.push(`${file}: summary and clinicalNote must each include en and pt strings`);
    }

    if (data.status === 'published' && data.placeholder !== true) {
      for (const locale of ['en', 'pt']) {
        if (!data.summary?.[locale]?.trim()) {
          errors.push(`${file}: published cards need a non-empty summary.${locale}`);
        }
        if (!data.clinicalNote?.[locale]?.trim()) {
          errors.push(`${file}: published cards need a non-empty clinicalNote.${locale}`);
        }
      }
    }
  }

  return errors;
}

function loadDocuments(itemsDir = ITEMS_DIR) {
  if (!fs.existsSync(itemsDir)) {
    return { documents: [], missingDir: true };
  }
  const files = fs.readdirSync(itemsDir).filter((name) => name.endsWith('.md'));
  return {
    documents: files.map((file) => ({
      file,
      data: matter(fs.readFileSync(path.join(itemsDir, file), 'utf8')).data,
    })),
    missingDir: false,
  };
}

function main() {
  const { documents, missingDir } = loadDocuments();

  if (missingDir) {
    console.log('validate:content — no items directory yet (ok)');
    return 0;
  }

  if (documents.length === 0) {
    console.error('validate:content — expected at least one content card under src/content/items/');
    return 1;
  }

  const errors = validateDocuments(documents);
  for (const error of errors) {
    console.error(`validate:content — ${error}`);
  }
  if (errors.length > 0) {
    return 1;
  }

  console.log(`validate:content — ok (${documents.length} card${documents.length === 1 ? '' : 's'})`);
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { validateDocuments, loadDocuments, isLocalePair };
