# Assisted curation (draft shortlist)

This folder holds **draft** candidate materials for the weekly PKD Digest. Nothing here is published to GitHub Pages automatically.

## Human workflow

1. **Generate a shortlist** (machine draft):

   ```bash
   python3 scripts/curate-shortlist.py --retmax 8
   ```

   Optional public RSS feeds:

   ```bash
   python3 scripts/curate-shortlist.py --retmax 8 \
     --rss 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1example/'
   ```

   Indexes land under `curation/generated/` (gitignored):

   - `shortlist-YYYY-MM-DD.json` — machine-readable candidates
   - `shortlist-YYYY-MM-DD.md` — human-readable list

   Draft cards are written under `src/content/items/` (see `docs/content-model.md`) with `status: draft` and `placeholder: false`. Optional `--issue YYYY-Www` stamps the Weekly Issue field.

2. **Human reviews** the shortlist. Keep, drop, or merge candidates. Prefer cystic kidney disease broadly (PKD and other cystic); tag clearly (e.g. ADPKD vs other cystic) so the weekly bar stays high.

3. For keepers: fill `summary.en` / `summary.pt` (and optional `clinicalNote.*`), set optional `issue: YYYY-Www`, set `status: published`, keep `placeholder: false`. Drop rejected draft files from `src/content/items/`.

4. **Publish** only through the normal site build / PR process. There is **no** auto-publish Action and **no** secrets required for the shortlist script (public PubMed E-utilities only).

## Front matter contract (match Dev 2 content model)

Draft cards emit:

```yaml
title: '…'
date: YYYY-MM-DD
issue: 'YYYY-Www' # optional Weekly Issue
source:
  url: 'https://…'
  name: 'PubMed | journal | outlet'
tags: [research, treatment, lifestyle, advocacy]
audience: [patients, clinicians]
summary:
  en: '…'
  pt: ''
clinicalNote:
  en: ''
  pt: ''
status: draft
placeholder: false
```

Human publish flips `status` to `published`, completes EN+PT Dual Framing, and sets `issue` when grouping into a Weekly Issue.

## Examples

See `curation/examples/` for a committed sample card and JSON shape. Do not treat examples as live clinical content without review.
