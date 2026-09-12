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

   Outputs land under `curation/generated/` (gitignored):

   - `shortlist-YYYY-MM-DD.json` — machine-readable candidates
   - `shortlist-YYYY-MM-DD.md` — human-readable list
   - `items-YYYY-MM-DD/*.md` — one draft card per candidate (front matter aligned with the content model)

2. **Human reviews** the shortlist. Keep, drop, or merge candidates. Prefer ADPKD-primary items; tag other cystic kidney content clearly.

3. **Copy chosen cards** into `src/content/items/` (content-model path). Fill `summary.en` / `summary.pt` (and optional `clinicalNote.*`), set `status: published`, keep `placeholder: false`.

4. **Publish** only through the normal site build / PR process. There is **no** auto-publish Action and **no** secrets required for the shortlist script (public PubMed E-utilities only).

## Front matter contract (match Dev 2 content model)

Draft cards emit:

```yaml
title: "…"
date: YYYY-MM-DD
source:
  url: "https://…"
  name: "PubMed | journal | outlet"
tags: [research, treatment, lifestyle, advocacy]
audience: [patients, clinicians]
summary:
  en: "…"
  pt: ""
clinicalNote:
  en: ""
  pt: ""
status: draft
placeholder: false
```

Human publish flips `status` to `published` and completes EN+PT summaries.

## Examples

See `curation/examples/` for a committed sample card and JSON shape. Do not treat examples as live clinical content without review.
