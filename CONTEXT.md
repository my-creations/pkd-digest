# PKD Digest / Digest DRP

This context defines the public product language for the bilingual weekly digest on cystic kidney disease.

## Language

**PKD Digest**:
The public English product name for this weekly curated digest. Hosted on GitHub Pages under `my-creations/pkd-digest`.
_Avoid_: Blog, news feed, medical journal

**Digest DRP**:
The public Portuguese product name (doença renal poliquística / digest). Prefer this label in PT UI copy; keep the repo slug `pkd-digest`.
_Avoid_: Translating the English brand inconsistently across pages

**Cystic Kidney Disease**:
The editorial scope — cystic kidney disease **in general** (includes ADPKD and other cystic kidney disease). Not limited to ADPKD-only.
_Avoid_: Framing the whole site as ADPKD-only; burying non-ADPKD items without clear tags

**Digest Card / Item**:
One curated update stored as a Markdown file under `src/content/items/*.md`, with dual nested EN+PT framing in the same file.
_Avoid_: Locale-split files (`*-en.md` / `*-pt.md`); calling cards “posts” or “articles”

**Weekly Issue**:
A set of Digest Cards that share the same ISO week `issue` value (`YYYY-Www`). The Digest page presents the current (or sample) issue; the Timeline lists cards chronologically across issues.
_Avoid_: Treating each card as its own newsletter send; requiring a separate CMS “issue” object in v1

**Dual Framing**:
Every card carries (1) a plain-language `summary` for patients and families and (2) a short `clinicalNote` for clinicians, each in EN and PT.
_Avoid_: Single-audience blurbs; clinical jargon in the plain-language summary

**Assisted Curation**:
The intended workflow: automated shortlist (e.g. PubMed/RSS) → human edit and publish. Shortlist emitters write `status: draft` cards; humans publish.
_Avoid_: Auto-publishing live clinical claims; implying the scaffold already runs PubMed fetch

**Timeline**:
The chronological index of Digest Cards (`/timeline/`, `/pt/timeline/`), reusing the same card partial as the Digest page.
_Avoid_: A second content type or duplicate markdown for timeline-only entries

**Placeholder**:
A fictional or layout-only card (`placeholder: true`) that must never be treated as real clinical content.
_Avoid_: Mixing real citations into placeholder cards without flipping `placeholder` to `false`

**Draft / Published**:
`status: draft` is for human review (including assisted shortlists). `status: published` is for public lists once curation starts. Scaffold samples stay draft + placeholder.
_Avoid_: Publishing placeholders; using draft as a soft-delete

**Audience tags**:
Per-card `audience` array using locked values `patients` and/or `clinicians`.
_Avoid_: Free-text audience strings; inventing roles outside the locked set

## Medical disclaimer

Educational curation only — **not medical advice**.
