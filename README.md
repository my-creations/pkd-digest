# PKD Digest / Digest DRP

Weekly bilingual **EN+PT** curated digest on **cystic kidney disease** (general cystic kidney disease — not ADPKD-only).

**Dual audience:** patients & families + clinicians  
**Dual framing per item:** plain-language summary + clinical note

> **Curation (later, out of scope for this PR):** assisted shortlist from PubMed/RSS → human publish. Mentioned here only; not implemented in this scaffold.

## Site

- **Public URL:** https://my-creations.github.io/pkd-digest/
- **pathPrefix:** `/pkd-digest/` (override with `ELEVENTY_PATH_PREFIX`, same pattern as [Portfolio](https://github.com/my-creations/portfolio))
- **Stack:** Eleventy 3 + Bun (not Vite)

## Local run

```bash
bun install
bun run start   # or: bun run dev
```

Build:

```bash
bun run build
```

Useful scripts:

| Script                     | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `bun run build`            | Validate content + Eleventy build → `_site/` |
| `bun run start` / `dev`    | Local Eleventy server                        |
| `bun run format`           | Format with oxfmt                            |
| `bun run format:check`     | CI format check                              |
| `bun run validate:content` | Light front-matter checks on content cards   |

## Locale routing

| Locale | Home   | Digest        | Timeline        |
| ------ | ------ | ------------- | --------------- |
| EN     | `/`    | `/digest/`    | `/timeline/`    |
| PT     | `/pt/` | `/pt/digest/` | `/pt/timeline/` |

Paths above are without `pathPrefix`. With the default prefix, Pages serves them under `/pkd-digest/...`.

## Content model

See [`docs/content-model.md`](docs/content-model.md).

Cards: `src/content/items/*.md` with nested `summary.en` / `summary.pt` and `clinicalNote.en` / `clinicalNote.pt` in one file.

## License / medical disclaimer

Educational curation scaffold only — **not medical advice**.
