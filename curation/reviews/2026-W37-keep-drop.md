# Curation review — 2026-W37 (TL-reconciled KEEP)

**KEEP max 6** — reconciled after Tech Lead audit of PR #9. All keepers: `issue: "2026-W37"`, `status: draft`, `placeholder: false` until Dual Framing + publish filter are ready.

## KEEP (6) — final

| #   | Card                                                       | Why                                                                                |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | `kdoqi-us-commentary-kdigo-2025-adpkd-guideline-2026.md`   | KDOQI US commentary on KDIGO 2025 ADPKD guideline — **PROMOTE** (guideline signal) |
| 2   | `pkd-cures-act-hr-9169-2026.md`                            | PKD Cures Act H.R. 9169 — **PROMOTE** advocacy / NIH roadmap                       |
| 3   | PMID [42709670](https://pubmed.ncbi.nlm.nih.gov/42709670/) | Kidney360 prognostic tools validation (multiethnic SA)                             |
| 4   | PMID [42701438](https://pubmed.ncbi.nlm.nih.gov/42701438/) | PLD scoping review PKD1/PKD2                                                       |
| 5   | PMID [42684643](https://pubmed.ncbi.nlm.nih.gov/42684643/) | UTI incident/recurrent risk in ADPKD                                               |
| 6   | PMID [42696964](https://pubmed.ncbi.nlm.nih.gov/42696964/) | Obstetric outcomes in PKD pregnancy                                                |

## Removed from PR (this reconcile)

| Item                            | Reason                                            |
| ------------------------------- | ------------------------------------------------- |
| PMID 42648283 semaglutide RWE   | Hype / RWE risk — DROP                            |
| PMID 42690926 PD vs HD (CJASN)  | Empty/unusable summary — DROP                     |
| PMID 42679840 Lancet UIA SR/MA  | Accepted DROP for this issue (was temporary KEEP) |
| PMID 42696112 TSC2/PKD1 imaging | Accepted DROP for this issue (was temporary KEEP) |

## Other notable DROPs (shortlist)

Case reports, letters/comments, basic science, radiomics (park), CJASN antibiotic/urolithiasis without abstract, etc.

## Dual Framing

PubMed keepers need **real** plain-language + clinicalNote EN+PT (not abstract stubs). Dev2 owns tighten; stay `status: draft` until TL framing audit.

## Product blocker (before any publish)

`latestIssueItems` / public `digestItems` must filter `status === published && !placeholder` so merging draft W37 cards cannot appear on the live digest/timeline. Fix that filter **before** flipping any card to `published`.
