# Curation review — 2026-W37 (TL SUPERSEDE final)

**KEEP max 6** — supersedes prior PMID-only lock and the KDOQI+Cures reconciliation. All keepers: `issue: "2026-W37"`, `status: draft`, `placeholder: false`.

## KEEP (6) — final

| #   | Card                                                       | Notes                                                                               |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | `kdoqi-us-commentary-kdigo-2025-adpkd-guideline-2026.md`   | KDOQI commentary on KDIGO 2025 ADPKD — non-PubMed                                   |
| 2   | PMID [42679840](https://pubmed.ncbi.nlm.nih.gov/42679840/) | Lancet Neurol UIA SR/MA — **ADPKD angle** (screening/counseling), not generic neuro |
| 3   | PMID [42709670](https://pubmed.ncbi.nlm.nih.gov/42709670/) | Kidney360 prognostic tools (multiethnic SA)                                         |
| 4   | PMID [42701438](https://pubmed.ncbi.nlm.nih.gov/42701438/) | PLD scoping PKD1/PKD2                                                               |
| 5   | PMID [42684643](https://pubmed.ncbi.nlm.nih.gov/42684643/) | UTI ADPKD matched cohort                                                            |
| 6   | PMID [42696964](https://pubmed.ncbi.nlm.nih.gov/42696964/) | Obstetric outcomes PKD                                                              |

## Out of this PR

| Item                            | Disposition                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| PMID 42696112 TSC2/PKD1 imaging | **Park** — DROP this issue                                   |
| `pkd-cures-act-hr-9169-2026.md` | **Park W38** — strong advocacy; not forced into ≤6 this week |
| PMID 42648283 semaglutide RWE   | DROP (hype)                                                  |
| PMID 42690926 PD vs HD          | DROP (empty summary)                                         |

## Dual Framing + publish gate

- Dev2: real plain + clinicalNote EN+PT on the 6 keepers; stay `draft` until TL framing audit.
- Dev4: filter `latestIssueItems` + public timeline to `published && !placeholder` **before** any publish (separate PR preferred).
