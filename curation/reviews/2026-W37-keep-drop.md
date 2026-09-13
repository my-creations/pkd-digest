# Curation review — 2026-W37

Source shortlist: `curation/generated/shortlist-2026-09-13.*` (20 PubMed candidates since 2026-01-01, issue stamp `2026-W37`).

**Bar:** high-signal only; cystic kidney disease broadly; dual audience (patients/families + clinicians); ≤6 KEEP; all keepers remain `status: draft` until Tech Lead audit.

## KEEP (6)

| #   | PMID                                                  | Why keep                                                                                                                            |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [42709670](https://pubmed.ncbi.nlm.nih.gov/42709670/) | Kidney360 external validation of ADPKD prognostic tools in a multiethnic cohort — directly useful for therapy selection counseling. |
| 2   | [42701438](https://pubmed.ncbi.nlm.nih.gov/42701438/) | Scoping review of PLD in PKD1/PKD2 carriers — broad cystic scope (liver), genetics + therapies.                                     |
| 3   | [42690926](https://pubmed.ncbi.nlm.nih.gov/42690926/) | CJASN modality question (PD vs HD) for incident ADPKD — high clinical decision value.                                               |
| 4   | [42684643](https://pubmed.ncbi.nlm.nih.gov/42684643/) | Matched cohort on incident/recurrent UTI risk in ADPKD — common patient-facing complication.                                        |
| 5   | [42696964](https://pubmed.ncbi.nlm.nih.gov/42696964/) | Obstetric outcomes in PKD pregnancies — families / reproductive planning.                                                           |
| 6   | [42648283](https://pubmed.ncbi.nlm.nih.gov/42648283/) | Real-world semaglutide × kidney outcomes in ADPKD — treatment-adjacent signal (framed as non-causal).                               |

Keeper cards: `src/content/items/*-{pmid}.md` with Dual Framing stubs, `issue: "2026-W37"`, `status: draft`, `placeholder: false`.

## DROP (14)

| PMID     | Reason                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| 42726516 | Antibiotic/urolithiasis niche; empty abstract in shortlist — low weekly signal.                                     |
| 42725607 | Single rare PLD/hydronephrosis case report.                                                                         |
| 42702893 | Single-variant genetics co-segregation — specialty genetics, not digest-core.                                       |
| 42696112 | Rare TSC2/PKD1 contiguous gene imaging series.                                                                      |
| 42690331 | Cerebrovascular cohort useful but overlaps aneurysm theme; prefer stronger UTI + modality + review slots this week. |
| 42686020 | Staphylococcal reservoir note; empty abstract — unclear signal.                                                     |
| 42679840 | Lancet Neurology aneurysm meta-analysis — population-level neurology; ADPKD only as comorbidity context.            |
| 42663107 | ARPKD basic science (fibrocystin/Src/STAT3) — too mechanistic for dual-audience digest.                             |
| 42662913 | Diffusion MRI radiomics — specialist imaging/ML; defer for a methods-heavy week.                                    |
| 42661607 | Tolvaptan hypothesis essay (Open Research Europe) — opinion, not primary evidence.                                  |
| 42657244 | BICC1/polycystin-1 basic morphogenesis module — too early-science.                                                  |
| 42657242 | Letter/response only.                                                                                               |
| 42656880 | Letter without usable abstract.                                                                                     |
| 42653412 | Comment on prior tolvaptan paper — not standalone.                                                                  |

## Query / RSS notes (pool quality)

Pool was usable but noisy (letters, comments, empty abstracts, deep basic science). Recommended script defaults for next run:

- Exclude `Letter[Publication Type] OR Comment[Publication Type] OR Editorial[Publication Type]`
- Optionally boost `Review[Publication Type] OR Guideline[Publication Type]`
- Keep cystic-kidney-broad terms; add PLD / ARPKD explicitly when wanting extra-renal mix
- Optional public RSS later (e.g. journal TOC) — not required for this week

Dual Framing EN+PT stubs are draft-quality; Dev2 invited to tighten before publish.
