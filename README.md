# PKD Digest

Weekly bilingual EN+PT curated digest on cystic kidney disease.

Site: https://my-creations.github.io/pkd-digest/

## Assisted curation (draft shortlist → human publish)

v1 curation is **assisted**, not automatic:

1. Run `python3 scripts/curate-shortlist.py` to fetch public PubMed candidates (optional RSS via `--rss`).
2. Review the draft shortlist under `curation/generated/` (JSON + markdown + per-item draft cards).
3. Copy chosen items into `src/content/items/`, complete EN+PT summaries, set `status: published`.
4. Ship through the normal PR / Pages workflow.

**Guarantees:** no API keys or secrets in the repo; no GitHub Action auto-publishes shortlist output to Pages. See [`curation/README.md`](curation/README.md) for the full workflow and front-matter contract.
