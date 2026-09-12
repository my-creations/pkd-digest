# Content model

Locked for Dev 1 / Dev 2 alignment. Cards live as Markdown files under `src/content/items/*.md`.

## Dual nested fields (one card, both locales)

Each card carries EN and PT in the **same** file. Do **not** split into locale-specific files.

## Front matter

| Field                                 | Type                   | Notes                                                         |
| ------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| `title`                               | string                 | Card title (shared)                                           |
| `date`                                | date                   | ISO-friendly date; drives timeline order                      |
| `source`                              | object                 | `{ url, name }` — external source                             |
| `tags`                                | string[]               | Topic tags                                                    |
| `audience`                            | string[]               | e.g. `patients`, `clinicians`                                 |
| `summary.en` / `summary.pt`           | string                 | Plain-language summary                                        |
| `clinicalNote.en` / `clinicalNote.pt` | string                 | Short clinical framing                                        |
| `status`                              | `published` \| `draft` | Only `published` is meant for public lists later              |
| `placeholder`                         | boolean                | `true` for scaffold/sample cards with no real clinical claims |

## Sample card

`src/content/items/sample-placeholder.md` is marked `placeholder: true` and `status: draft`. It uses lorem/sample copy only.

## Rendering (v1)

Cards feed Eleventy collections (`digestItems`, `publishedItems`). They do not emit standalone permalinks in this scaffold; Digest and Timeline pages list them.
