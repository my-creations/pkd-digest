# Curation review: 2026-W41 (completion) and 2026-W42 (prepared)

Prepared on 2026-10-10 (Saturday, ISO 2026-W41). Same workflow as the W38–W41 backfill (`2026-W38-W41-keep-drop.md`): run the shortlist, read every PubMed abstract, keep or drop, and write the full EN+PT Dual Framing plus a visit question for each keeper from the abstract only.

## How the candidates were found

- `bun run curate:shortlist --skip-existing --issue 2026-W41 --retmax 30`. This is the documented command, with a wider `--retmax` so that no paper entered since the last run is cut off. It wrote 21 draft cards, listed in the tables below.
- A cross-check of the same PubMed query by entry date (`datetype=edat`):
  - 2026-09-28 → 10-04: 8 results. 4 were not curated yet, and 3 of those were already dropped in the backfill. The remaining paper, 42804341, was missed by the W41 run, which only fetched 8 results.
  - 2026-10-05 → 10-11: 10 results, none curated yet. 42831022 was already dropped in the backfill.
  - 2026-10-12 → 10-18: 0 results so far.
- The shortlist also surfaced 4 papers entered on 2026-09-22 → 09-24 that the W40 run never fetched, because it was limited to 8 results. Three are kept and one is an erratum.

## Issue mapping

All keepers below are stamped `2026-W41`, as requested: W41 is completed with papers entered through Oct 11. The three missed W40-window papers also go into W41, so the already-published W40 issue stays as it was. To file them under W40 instead, change `issue:` on the three cards dated 2026-09-22 and 09-23.

This differs from the weekly Action. The Action stamps the ISO week it runs in, so its Monday 2026-10-12 run would have labelled the Oct 5–11 papers `2026-W42`. To move them, change `issue:` on the five cards dated 2026-10-05 → 10-09.

## KEEP (9, all 2026-W41)

| PMID                                                  | Entry date | Journal         | Card                                                                     |
| ----------------------------------------------------- | ---------- | --------------- | ------------------------------------------------------------------------ |
| [42772449](https://pubmed.ncbi.nlm.nih.gov/42772449/) | 2026-09-22 | Kidney Int      | Scalable cyst-forming organoids as a drug-screening platform (TLR4 lead) |
| [42771475](https://pubmed.ncbi.nlm.nih.gov/42771475/) | 2026-09-22 | Kidney360       | Pkd1 loss disrupts the kidney's own circadian clock (mice, cells)        |
| [42778146](https://pubmed.ncbi.nlm.nih.gov/42778146/) | 2026-09-23 | Kidney Int      | Human anti-PAPP-A antibodies in two PKD mouse models                     |
| [42804341](https://pubmed.ncbi.nlm.nih.gov/42804341/) | 2026-09-28 | Kidney360       | Spatial, single-nucleus and bulk transcriptome of ADPKD cysts            |
| [42832063](https://pubmed.ncbi.nlm.nih.gov/42832063/) | 2026-10-05 | J Gastroenterol | Symptomatic polycystic liver disease in Japan, nationwide survey         |
| [42834985](https://pubmed.ncbi.nlm.nih.gov/42834985/) | 2026-10-06 | iScience        | RhoA drives mitochondrial fragmentation in PKD cells                     |
| [42840242](https://pubmed.ncbi.nlm.nih.gov/42840242/) | 2026-10-07 | Kidney Int Rep  | Kidney arterial embolization and cyst infection (retrospective, n=416)   |
| [42850364](https://pubmed.ncbi.nlm.nih.gov/42850364/) | 2026-10-08 | Pediatr Res     | Brain iron deposition in a paediatric Pkd2 mouse model                   |
| [42855640](https://pubmed.ncbi.nlm.nih.gov/42855640/) | 2026-10-09 | Eur J Pediatr   | Hepatic manifestations of ciliopathies (review)                          |

The Japan PLD survey (42832063) also joins the `polycystic-liver` collection. That collection's intro now says "A review, a nationwide survey and a single case".

Each card's `date` is the PubMed entry date, matching the backfill cards. Each card says what kind of evidence it is (cell, animal, retrospective, survey or review) and names no treatment for the reader to take.

## DROP or PARK

| PMID     | Item                                                                           | Disposition                                                                                           |
| -------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 42851272 | PKD2 D511V destabilises the channel and degrades cilia (bioRxiv)               | **Park.** Preprint, not peer-reviewed. Revisit when it is published in a journal.                     |
| 42840512 | Genomic and epigenomic landscape of ADPKD (Front Epigenet Epigenom)            | DROP. Broad narrative review with no new data, overlapping the W40 children review and the MLPA card. |
| 42836988 | Percutaneous sclerotherapy for simple hepatic cysts (meta-analysis)            | DROP. Explicitly excludes polycystic liver disease, so it is outside scope.                           |
| 42836160 | Organoid Tracker, SAM2 software for organoid videos (SPIE)                     | DROP. A research software tool with no disease findings.                                              |
| 42779572 | Correction to "Tolvaptan: a possible preemptive treatment option in children…" | DROP. Erratum.                                                                                        |

Already decided in the W38–W41 backfill and dropped again from this shortlist:

| PMID     | Item                                              | Disposition                                     |
| -------- | ------------------------------------------------- | ----------------------------------------------- |
| 42831022 | PNET metastases mimicking PLD (case)              | DROP. Oncology mimic.                           |
| 42808638 | AI in nephrology (review)                         | DROP. General.                                  |
| 42829006 | Cranio-orbital perineural cysts in ADPKD          | DROP. No abstract.                              |
| 42828088 | Corrigendum (Radiology Case Reports)              | DROP. Erratum.                                  |
| 42792963 | Precision medicine in paediatric nephrology       | DROP. Broad review.                             |
| 42779582 | VEO-ADPKD with congenital adrenal hyperplasia     | DROP. Single case.                              |
| 42789922 | Cardiovascular-kidney-metabolic syndrome in ADPKD | **Still parked.** PubMed still has no abstract. |

## 2026-W42 (Oct 12–18): ready for the rest of the week

PubMed has no entries for this window yet. When there are some, run:

```bash
bun run curate:shortlist --skip-existing --issue 2026-W42 --retmax 30
```

Then review and frame the keepers the same way, and add them to a new `## KEEP` table for W42 in this file. The scheduled Action on Monday 2026-10-12 will also open a draft PR stamped `2026-W42`, provided "Allow GitHub Actions to create and approve pull requests" is enabled (see the backfill note).
