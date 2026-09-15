# Content model

Locked for Dev 1 / Dev 2 / Dev 3 alignment. Cards live as Markdown files under `src/content/items/*.md`.

See also [`CONTEXT.md`](../CONTEXT.md) for product vocabulary (PKD Digest / Digest DRP, Weekly Issue, Dual Framing, Assisted Curation).

## Dual nested fields (one card, both locales)

Each card carries EN and PT in the **same** file. Do **not** split into locale-specific files.

## Front matter

| Field                                 | Type                   | Notes                                                                       |
| ------------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| `title.en` / `title.pt`               | string                 | Card title in each locale — PT must be a real translation, not a copy of EN |
| `date`                                | date                   | ISO-friendly date; drives timeline order                                    |
| `issue`                               | string (optional)      | ISO week `YYYY-Www` grouping cards into a Weekly Issue                      |
| `source`                              | object                 | `{ url, name }` — external source (`url` required)                          |
| `tags`                                | string[]               | Topic tags (locked set below)                                               |
| `audience`                            | string[]               | Locked: `patients`, `clinicians` (one or both)                              |
| `summary.en` / `summary.pt`           | string                 | Plain-language summary                                                      |
| `clinicalNote.en` / `clinicalNote.pt` | string                 | Short clinical framing                                                      |
| `status`                              | `published` \| `draft` | Only `published` is meant for public lists later                            |
| `placeholder`                         | boolean                | `true` for scaffold/sample cards with no real clinical claims               |

## Locked vocabularies

### `tags` (topic)

When `placeholder` is `false`, each tag must be one of:

- `research`
- `treatment`
- `lifestyle`
- `advocacy`

When `placeholder` is `true`, `sample` and `placeholder` tags are also allowed (layout samples only).

### `audience`

Only:

- `patients`
- `clinicians`

### `issue`

Optional. When present, must match `^\d{4}-W\d{2}$` (ISO week). Cards that share an `issue` form one **Weekly Issue**.

## Sample weekly issue

`issue: "2026-W36"` is the fictional sample week:

- `src/content/items/sample-placeholder.md`
- `src/content/items/sample-placeholder-2.md`

Both are `placeholder: true` and `status: draft` with lorem/sample copy only — no real clinical claims.

## Assisted curation (Dev 3)

Shortlist emitters should write draft markdown under `src/content/items/` with:

- `status: draft`
- `source.url` / `source.name` filled
- best-guess `tags` + `audience`
- `summary` / `clinicalNote` empty strings or a one-line title stub
- `placeholder: false` for real candidates (humans still publish)

Human publish flips `status` to `published` and writes full EN+PT Dual Framing. **No auto-publish.** CI enforces this: `validate:content` fails published non-placeholder cards with an empty `summary` or `clinicalNote` in either language.

## Rendering (v1)

Cards feed Eleventy collections (`digestItems`, `publishedItems`, `latestIssueItems`) and emit standalone permalinks:

- **Card pages** (`/digest/<slug>/`, `/pt/digest/<slug>/`): one page per published card via pagination (`digest/cards.njk`, `pt/digest/cards.njk`), with full Dual Framing, canonical + EN/PT alternate meta, a back link to the digest, and a “See also” section (up to 3 other published cards ranked by shared tags, then newest). Only `published` non-placeholder cards get pages.
- **Digest** (`/digest/`, `/pt/digest/`): lists `latestIssueItems` (cards for the newest `issue`, or all cards if none set). River titles link to the standalone card pages; the rail keeps in-page `#digest-item-N` anchors.
- **Timeline** (`/timeline/`, `/pt/timeline/`): lists all `digestItems` chronologically (same card partial).

Known Eleventy quirk: only the first page of a paginated template lands in `collections.all`, so the sitemap emits card URLs from `collections.publishedItems` directly (both locales, cross-linked) instead of relying on collection membership.
