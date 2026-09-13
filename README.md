# PKD Digest / Digest DRP

Weekly bilingual **EN+PT** curated digest on **cystic kidney disease** (general cystic kidney disease — not ADPKD-only).

**Dual audience:** patients & families + clinicians  
**Dual framing per item:** plain-language summary + clinical note

## Site

- **Public URL:** https://my-creations.github.io/pkd-digest/
- **pathPrefix:** `/pkd-digest/` (override with `ELEVENTY_PATH_PREFIX`, same pattern as [Portfolio](https://github.com/my-creations/portfolio))
- **Stack:** Eleventy 3 + Bun (not Vite)

## GitHub Pages

Production deploys `_site/` via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) on pushes to `main` (and `workflow_dispatch`). Default `pathPrefix` remains `/pkd-digest/`.

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

See [`docs/content-model.md`](docs/content-model.md) and [`CONTEXT.md`](CONTEXT.md).

Cards: `src/content/items/*.md` with nested `summary.en` / `summary.pt` and `clinicalNote.en` / `clinicalNote.pt` in one file.

## Assisted curation (draft shortlist → human publish)

v1 curation is **assisted**, not automatic:

1. Run `python3 scripts/curate-shortlist.py` to fetch public PubMed candidates (optional RSS via `--rss`; optional `--issue YYYY-Www`).
2. Review the draft shortlist under `curation/generated/` and draft cards under `src/content/items/` (`status: draft`).
3. Complete EN+PT Dual Framing on keepers, set `issue` if needed, set `status: published`; remove rejected drafts.
4. Ship through the normal PR / Pages workflow.

**Guarantees:** no API keys or secrets in the repo; no GitHub Action auto-publishes shortlist output to Pages. See [`curation/README.md`](curation/README.md) for the full workflow and front-matter contract.

## Privacy / analytics

**v1 decision: no analytics.** The site does not load Plausible, GA, or other tracking scripts. Policy for visitors: [`/privacy/`](https://my-creations.github.io/pkd-digest/privacy/) (PT: [`/pt/privacy/`](https://my-creations.github.io/pkd-digest/pt/privacy/)). Maintainer note: [`docs/privacy.md`](docs/privacy.md). Plausible remains the preferred _future_ option only if product explicitly revisits metrics.

## License / medical disclaimer

Educational curation scaffold only — **not medical advice**.
