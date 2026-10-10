# Polish report: `feat/pkd-polish`

Branch `feat/pkd-polish`, 17 commits on top of `main` plus this report. Nothing has been pushed, opened as a PR, merged or deployed. Everything is ready for Pedro to review.

## Summary

- **Patients get easier reading.**
  - No text is smaller than 12px.
  - Summaries are upright, not italic, and lines stop at about 68 characters.
  - On phones the page has 16px side margins, and on touch screens every control is at least 40px tall.
  - The home page has one primary button.
- **Bugs fixed.**
  - Search result links 404'd on GitHub Pages.
  - The Atom feed was malformed.
  - The start-here pages declared the home pages as their language alternates.
  - The 3D kidney spun forever, which fails WCAG 2.2.2. It now stops after 5 seconds.
- **Security.**
  - All three workflows use least-privilege tokens.
  - Every action is pinned to a commit SHA, and Dependabot bumps the pins weekly.
  - The validator rejects non-http(s) card links.
  - The curation script validates PubMed input before it reaches a file path or YAML.
  - Every page has a same-origin Content-Security-Policy.
- **Performance.** The 3D page ships 260 KB less JavaScript. three.js is now the exact published npm file.
- **Privacy and terms pages** are rewritten in plain language, EN and PT in sync. The policy is unchanged.
- **Medical content.** Nothing under `curation/` or `src/content/items/` changed, and no medical claims were added.

## Commits

| Commit    | What changed                                                                                                                                                                                                                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `07008ca` | oxfmt ignores the local, git-ignored `.claude/` folder. Without this, `format:check` failed on `.claude/settings.local.json`.                                                                                                                                                                                                                                                                     |
| `23d1a28` | Workflows: `ci.yml` gets top-level `contents: read`. `deploy-pages.yml` gives `pages`/`id-token: write` to the deploy job only and sets `cancel-in-progress: false`. `setup-bun` and `lychee-action` are pinned to a SHA. `persist-credentials: false` is set where the token isn't needed. The `issue` dispatch input is checked against `YYYY-Www` before it reaches `$GITHUB_ENV`.             |
| `3bde860` | `validate-content.js` rejects any `source.url` that doesn't start with `http://` or `https://`, which blocks `javascript:` and `data:` hrefs. Unit test added.                                                                                                                                                                                                                                    |
| `e278536` | `curate-shortlist.py` skips non-numeric PMIDs (they were used in file paths), requires a 4-digit year (it was written unquoted into YAML), and always escapes `\` and `"` in YAML strings.                                                                                                                                                                                                        |
| `3b90fae` | Search result links include the `/pkd-digest/` pathPrefix through a `data-card-base` attribute. Before this, every result 404'd on Pages, and the e2e test asserted the broken URL.                                                                                                                                                                                                               |
| `a63847e` | The Atom feed's `type="html"` content is escaped. Before this, it held raw `<p>` elements that feed readers drop. e2e assertion added.                                                                                                                                                                                                                                                            |
| `5b5b5b5` | `/start-here/` and `/pt/start-here/` hreflang alternates point at start-here, not at the home pages. e2e test added.                                                                                                                                                                                                                                                                              |
| `4fa7946` | Readability CSS. Type floor of 0.75rem. Summaries and clinical notes are upright at 1.0625rem with a 68ch measure, and the standfirst is 1.125rem. Section prose is capped at 68ch. Standalone card titles are larger. Mobile gutters are 1rem. Coarse-pointer controls are at least 2.5rem tall. `color-scheme: light`. A `prefers-reduced-transparency` fallback for the glass topbar and rail. |
| `5113bea` | The kidney auto-spin stops after 5 seconds. It is frame-rate independent (it scales with elapsed time, so 120 Hz screens no longer spin twice as fast). It reads the reduced-motion setting live. Smooth scroll and the button hover lift apply only when reduced motion is not requested. e2e test drives a fake clock.                                                                          |
| `2e4d8b6` | Home: one primary action per page. The second "This week's digest" button becomes the secondary "Read the full issue", and the third button is also secondary. e2e test asserts exactly one `button--primary` in `main`.                                                                                                                                                                          |
| `548a81c` | Issue titles in the rail and TOC are no longer cut mid-word with `truncate(48)`. CSS clamps them to three lines instead. The rail inside the home "Latest issue" card is flat, which removes the nested card.                                                                                                                                                                                     |
| `a6e8a62` | Interface copy, EN and PT kept in sync. See [Copy changes](#copy-changes-no-ai-slop).                                                                                                                                                                                                                                                                                                             |
| `cb21bc2` | `src/js/vendor/three.module.min.js` is replaced with the byte-identical `build/three.module.min.js` from npm `three@0.170.0`. The repo copy had been run through a formatter, which made it 952 KB. README gains a "Vendored code" section with the source and SHA-256.                                                                                                                           |
| `65642b2` | Same-origin CSP meta in `base.njk`: `default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'`. e2e test loads 5 pages and fails on any CSP violation.                                                                                                                                                                                                    |
| `242a971` | All remaining actions (`actions/checkout`, `setup-python`, `upload-artifact`, `upload-pages-artifact`, `deploy-pages`) are pinned to the commit SHA of their current release, with the version in a comment. New `.github/dependabot.yml` opens one grouped weekly PR for `github-actions`.                                                                                                       |
| `5f40b94` | Privacy and terms copy rewritten, EN and PT in sync. See [Privacy and terms copy](#privacy-and-terms-copy).                                                                                                                                                                                                                                                                                       |
| `17dcd31` | Home curation note says the summaries are drafted with AI help, then a person reviews, edits and decides what to publish. The earlier wording ("a person writes") was inaccurate.                                                                                                                                                                                                                 |

## What each skill found

### poteto-mode

poteto-mode set the working method rather than producing findings.

- **Principles applied.**
  - **Subtract before you add.** No dependencies were added. The vendored three.js is the published file rather than a re-minified one. Native CSS media queries replace JS for reduced motion and reduced transparency. Existing classes (`button--secondary`, the `url` filter) were reused.
  - **Prove it works.** Every behavioural fix has an e2e or unit test that failed before the fix. The kidney spin test and the CSP test each have a negative control that fails as expected.
  - **Sequence verifiable units.** There is one concern per commit, and each was checked before the next.
  - **Experience first.** Readability for an older patient on a phone decided the ties. For example, touch targets cost 23px of sticky-topbar height on mobile.
- **Never block on the human.** Reversible calls were made and recorded under [Open questions](#open-questions-and-todos-for-pedro).

### unlazy

- The acceptance gates were written before any change: build, lint, unit, format, e2e (Chromium desktop and mobile, Firefox), e2e WebKit, Lighthouse, curation content untouched, no tracking, no new dependencies, not pushed, report complete, tree clean, and an EN/PT copy review.
- Final state:
  - 13 gates are met.
  - G6 (WebKit) is **abandoned**. WebKit can't launch on this machine because host libraries are missing (`libicu74`, `libxml2`, `libflite1`), and installing them needs sudo. CI installs them with `--with-deps`, so CI will be the first WebKit run of this branch.

### impeccable (critique A and B, audit, detector)

- **Critique A (design review): 26/36 (Good).**
  - Contrast and focus rings are strong: 6.7:1 muted text and a 2px oxblood ring.
  - Touch targets were 15–23px on mobile.
  - Interactive text was below 13px.
  - Summaries were italic and grey, with lines of about 95 characters on desktop.
  - The home page repeated its CTA and nested a card inside a card.
  - TOC titles were cut mid-phrase.
  - The audience mode isn't remembered between visits.
- **Critique B (detector).**
  - Undersized UI text: a 9.92px masthead tagline, and 10.56–10.88px kidney labels.
  - Nested cards on home.
  - Em-dash overuse on home.
  - Line length above 94 characters on home and digest, and about 140 on start-here.
  - Low contrast on two start-here texts.
  - Cramped padding on the masthead and topbar.
  - Border accent on a rounded card.
  - Cream palette, which is the intentional brand paper.
- **Audit: 14/20.**
  - P1: wrong start-here hreflang.
  - P1: three.js loads at first paint on start-here (952 KB).
  - P2: auto-rotation can't be paused (WCAG 2.2.2).
  - P2: line length.
  - P2: tap targets.
  - P2: small text.
  - P3: no `color-scheme`.
  - P3: blunt reduced-motion rule.
  - P3: endless render loop.
- **After this branch.** The detector reports no undersized text, no nested cards, no em-dash overuse and no flat type hierarchy. Cramped padding on the masthead and topbar and the card's top border accent remain on purpose (see [Left alone](#left-alone-deliberately)).

### design-taste-frontend

- **Design read.** Trust-first editorial. Brand fixed, so it worked in redesign-preserve mode.
- **Authored.** The digest river, the dateline, the masthead and the oxblood numerals.
- **Templated.**
  - Stacks of rounded, shadowed section cards on home and start-here (10 on start-here).
  - Mixed radii.
  - A cool shadow tint on warm paper.
  - The clinical block styled the same as the plain one.
- **Top mobile issues.**
  - 4px gutters with inconsistent left edges.
  - 22–23px touch targets.
  - Italic, muted summaries.
  - The `/digest/` first screen is all filters and rail.
  - The kidney stage scrolls away from its controls.
  - Three primary CTAs on home.
  - Long measure on desktop.
  - A tiny standalone card title.
  - No `prefers-reduced-transparency` fallback for the glass bar.
- **Applied.** Gutters, touch targets, upright summaries, CTA hierarchy, measure, card title size and the reduced-transparency fallback. The rest is under [Left alone](#left-alone-deliberately) or [Open questions](#open-questions-and-todos-for-pedro).

### modern-web-guidance

Each pattern touched was checked against its guide.

- Reduced motion is a media query on the CSS side and a `matchMedia` object read every frame on the JS side, so changing the OS setting takes effect without a reload.
- `prefers-reduced-transparency` falls back to an opaque background.
- `text-wrap: pretty` is used on prose. Browsers without it ignore it.
- The measure is set in `ch`.
- `scroll-behavior: smooth` applies only under `no-preference`.
- Coarse-pointer target sizing uses `@media (pointer: coarse)`.
- `color-scheme: light` makes form controls and scrollbars match the paper theme.

All of these are Baseline widely available except `text-wrap: pretty` and `prefers-reduced-transparency`. Both degrade to the current behaviour.

### no-ai-slop

The scan covered interface copy only: `i18n.js`, the page templates and `topicBundles` ledes.

- **Broken or out-of-sync pairs.**
  - The timeline lede ("when present").
  - The start-here lede, where EN asked a question and PT assumed a diagnosis.
  - The terms grammar ("we may be wrong").
  - PT "a este diagnóstico".
  - PT clinical-note wording.
  - "items" versus "cards".
  - PT "Advocacia", which means the legal profession in PT-PT.
  - PT "tu" register slips.
- **Slop.**
  - Negative contrast ("not ADPKD-only").
  - Decorative dashes.
  - Jargon in public copy: "indexed as in the digest", "human Dual Framing and publish".
  - A recap sentence in `nextBody`.
- **Applied, and left as proposals.** See [Copy changes](#copy-changes-no-ai-slop). The privacy, terms and lifestyle proposals were not applied (see [Open questions](#open-questions-and-todos-for-pedro)).

### vibe-security

No Critical or High findings.

- **Medium.**
  - `ci.yml` had no `permissions:` block.
  - Third-party actions were pinned to tags only.
  - The deploy workflow's build job held `pages`/`id-token: write`.
- **Low.**
  - `source.url` scheme was not validated. A `javascript:` link would reach the page.
  - PubMed PMID and year were not validated before use as a path and in YAML.
  - The `issue` input could inject a newline into `$GITHUB_ENV`.
  - `persist-credentials` was left at its default.
- **Info.** PRs opened with `GITHUB_TOKEN` don't trigger CI.
- **Non-security bugs found along the way.** The search pathPrefix 404 and the unescaped Atom content.
- **Hardening.** A CSP meta is feasible because the site has no inline scripts or styles and no third-party resources. Record the vendored three.js source and hash.
- **Applied.** Everything, including Dependabot and first-party action pins after Pedro approved them. Still open: curate-shortlist credentials and the auto-PR CI trigger (see [Open questions](#open-questions-and-todos-for-pedro)).

## Copy changes (no-ai-slop)

Every changed key was changed in both languages, or was a single-language fix to bring PT in line with EN (or the reverse).

| Key                              | Before (EN)                                                                                     | After (EN)                                                                                                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `home.lede`                      | "…on cystic kidney disease — general cystic kidney disease, not ADPKD-only. Each item carries…" | "…on cystic kidney disease, including ADPKD and other forms. Each card has…"                                                                                                                                                                                       |
| `home.howIntro`                  | "…twice — for families and for clinicians — and helps you bring it to your visit."              | "…twice: once for families, once for clinicians."                                                                                                                                                                                                                  |
| `home.curationBody`              | "Assisted curation: PubMed/RSS shortlist, then human Dual Framing and publish."                 | "A script shortlists new PubMed papers each week. The summaries are drafted with AI help, then a person reviews and edits each one and decides what to publish." (Disclaimer kept. Corrected on 2026-10-10 after Pedro pointed out the summaries are AI-assisted.) |
| `home.latestBody`                | "The newest cards, indexed as in the digest — …"                                                | Removed. The issue card and its new "Read the full issue" button already say this.                                                                                                                                                                                 |
| `home.ctaIssue` (new)            | n/a                                                                                             | "Read the full issue" / "Ler a edição completa"                                                                                                                                                                                                                    |
| `startHere.lede`                 | "New to cystic kidney disease? A short guide … to finding your way around PKD Digest."          | "A short guide for patients and families: what cystic kidney disease is, how to read a card, and where to go next in PKD Digest."                                                                                                                                  |
| `startHere.readingTitle`         | "What to keep track of — and how to read a card"                                                | "What to keep track of, and how to read a card"                                                                                                                                                                                                                    |
| `startHere.nextBody`             | "…browse individual updates… All three lead to published cards in English and Portuguese."      | "…browse cards one by one on the timeline…" (recap sentence cut)                                                                                                                                                                                                   |
| `timeline.lede`                  | "Cards in chronological order when present."                                                    | "All published cards, newest first." (Checked: `eleventy.config.js` sorts by `b.date - a.date`.)                                                                                                                                                                   |
| `digest.empty`, `timeline.empty` | "No published items…"                                                                           | "No published cards…"                                                                                                                                                                                                                                              |
| `search.noResults`               | "No cards match that search."                                                                   | "…Try a shorter word." / "…Experimente uma palavra mais curta."                                                                                                                                                                                                    |
| `terms.accuracyBody`             | "…but we may be incomplete, delayed, or wrong."                                                 | "…but they may be incomplete, delayed, or wrong." (Grammar only. The warning is unchanged and matches PT "podem estar".)                                                                                                                                           |
| `meta.notFoundBody`              | "This page is not part of PKD Digest…"                                                          | "We can’t find that page…"                                                                                                                                                                                                                                         |
| `topicBundles.lede`              | "Curated reading lists on shared concerns, bringing together…"                                  | "Reading lists by topic. Each one gathers published cards from different weekly issues."                                                                                                                                                                           |

PT-only alignments:

- `howClinicalText` is now "dá o contexto técnico aos profissionais."
- `howScope` and `scopeBody` say "ao seu diagnóstico".
- `notFoundCta` is now "Voltar ao início do Digest DRP".
- Tag `advocacy` is now "Defesa dos doentes".
- Search `lede` and `hint` use the "você" register: "Pesquise" and "Escreva".

None of these strings is a card, summary, clinical note, citation or disclaimer. Every "Educational only — not medical advice" line is untouched, dash included.

### Privacy and terms copy

Applied after Pedro approved it on 2026-10-10. The policy itself is unchanged: no analytics, no cookies of the site's own, Plausible as the preferred option if metrics are ever wanted. One sentence is new: the privacy page says it would be updated if that changed.

| Key                     | Before (EN)                                                                                                                                          | After (EN)                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `privacy.lede`          | "How PKD Digest handles analytics and personal data."                                                                                                | "How PKD Digest handles your data."                                                                                                                                                     |
| `privacy.decisionTitle` | "Analytics decision (v1)"                                                                                                                            | "No analytics"                                                                                                                                                                          |
| `privacy.decisionBody`  | "…There is no Plausible, Google Analytics, or similar tag in the layout."                                                                            | "…It does not load Plausible, Google Analytics or similar tools."                                                                                                                       |
| `privacy.whyTitle`      | "Why none for now"                                                                                                                                   | "Why no tracking"                                                                                                                                                                       |
| `privacy.whyBody`       | "…avoids unnecessary third-party data flows. GitHub Pages / GitHub may still process standard server or CDN logs outside this repository's control." | "…With no traffic trackers, this site sends no reader data to third parties. GitHub Pages, which hosts the site, may still process standard server or CDN logs that we do not control." |
| `privacy.cookiesBody`   | "…Essential hosting/CDN behaviour may still apply at the infrastructure layer."                                                                      | "…The hosting provider and its CDN may still apply their own essential behaviour."                                                                                                      |
| `privacy.revisitTitle`  | "Revisit"                                                                                                                                            | "Possible changes"                                                                                                                                                                      |
| `privacy.revisitBody`   | "…only after an explicit product decision and a separate PR. Until then, "no analytics" remains the documented policy."                              | "…That would be a deliberate decision, and this page would be updated. Until then, the policy is no analytics."                                                                         |
| `privacy.legalNote`     | "…See also the medical disclaimer on the site."                                                                                                      | "…See also Terms and disclaimer." (disclaimer sentence unchanged)                                                                                                                       |
| `terms.noWarrantyBody`  | "…the maintainers are not liable…"                                                                                                                   | "…the people who run this site are not liable…"                                                                                                                                         |
| `terms.licensingBody`   | "Linked papers and guidelines remain the property of their publishers; we provide attribution and links, not republication of full texts."           | "The papers and guidelines we link to belong to their publishers. We credit and link to them; we do not republish full texts."                                                          |

PT follows the same structure and drops the Anglicisms: "analytics" becomes "análise de tráfego", "tracking/trackers" becomes "rastreio", "hosting" becomes "alojamento", "logs" becomes "registos", "guidelines" becomes "orientações clínicas", and "mantenedores" becomes "os responsáveis pelo site". "Na máxima medida" becomes "Na medida máxima", and "não são responsáveis" becomes "não respondem" to avoid repeating "responsáveis". The "Não é aconselhamento médico" and accuracy sections are unchanged in both languages.

## Medical content

No changes. `git diff --name-only main..HEAD -- curation src/content` is empty. No typo or format fixes were needed or made under `curation/` or in any card. The only curation-adjacent code change is input validation in `scripts/curate-shortlist.py` and `scripts/validate-content.js`. Both reject bad input and change no existing card's output.

## Before and after

Measured on Chromium with a Playwright script unless noted.

| Measure                                            | Before                                | After                                                                 |
| -------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Text nodes under 12px, per page                    | 7–38                                  | 0                                                                     |
| Smallest tappable control, mobile (coarse pointer) | 15–23px tall                          | 40px                                                                  |
| Mobile left edge of hero, filters, lead            | 4px                                   | 16px                                                                  |
| Desktop prose line length                          | ~95 chars (digest), ~140 (start-here) | 68ch cap                                                              |
| Plain summary style                                | 16px italic, muted                    | 17px upright                                                          |
| Primary buttons on home                            | 3                                     | 1                                                                     |
| Kidney auto-spin                                   | Forever. Speed tied to frame rate.    | 5 seconds, then still. Time-based speed. Reduced motion applies live. |
| three.js on `/start-here/`                         | 952 KB raw / 196 KB gzip              | 692 KB raw / 171 KB gzip                                              |
| Sticky topbar height, mobile                       | 71px                                  | 94px (trade-off for 40px nav targets)                                 |
| Search result links on Pages                       | 404 (`/digest/…`)                     | `/pkd-digest/digest/…`                                                |
| Start-here hreflang                                | Home pages                            | Start-here pages                                                      |
| axe (in e2e)                                       | Clean                                 | Clean                                                                 |
| Lighthouse (home, digest, PT digest)               | Not measured before                   | 100 / 100 / 100 / 100 on all three. LCP 1.35–1.50s, CLS 0, TBT 0.     |

Before and after screenshots at 1280px and 390px were taken during the run. They live in the session scratchpad and are not committed.

## Left alone, deliberately

- **Masthead and topbar padding.** The detector flags them as cramped. The tight broadsheet bar is the brand.
- **Card top border accent.** The detector flags a border accent on a rounded card. It is the brand's rule line.
- **Mono kickers and eyebrows.** impeccable bans eyebrow labels. Here they are part of the Broadsheet Rail identity and are kept within the count design-taste-frontend allows.
- **Cream paper palette.** Flagged by the detector. It is the brand.
- **The clinical block mirrors the plain block's styling.** Giving it the unused `--clinical-bg`/`--clinical-border` treatment changes how the two audiences are framed relative to each other. That is a call for Pedro.
- **Section card stacks on home and start-here, mixed radii, cool shadow tint.** Flattening them is a visual redesign beyond polish.
- **Serif heading tracking of -0.03em.** It is within the craft floor (-0.04em).
- **Em dashes inside every disclaimer** ("Educational only — not medical advice"). Disclaimers are not touched.
- **Lifestyle copy.** It is near-medical text. The proposal is listed below.
- **Inline help for ADPKD, tolvaptan and eGFR.** That would be new explanatory content, which is close to a medical claim.
- **Dark mode.** There is none, and the paper brand suggests that is intended. `color-scheme: light` makes this explicit.

## Pedro's decisions (2026-10-10)

- **Remembered reader mode: not wanted.** Readers keep choosing plain or clinical per card. Nothing is stored.
- **3D model: loading it when the reader opens start-here is fine.** The current behaviour stays.
- **Dependabot and SHA pins for every action: approved.** Done in `242a971`.
- **Privacy and terms rewrite: approved.** Done in `5f40b94`.
- **Curation note: summaries are AI-assisted.** The home page now says so. Done in `17dcd31`.

## Open questions and TODOs for Pedro

1. **Mobile `/digest/` first screen.** Filters and the rail push the lead headline below the fold at 390×844. Options: make the rail a horizontal strip, move it after the lead, or collapse the filters into `<details>`.
2. **Sticky kidney stage on mobile,** so tapping a structure button shows its effect.
3. **Touch targets are 40px, not 44px.** That is above WCAG 2.5.8 AA (24px) and below 2.5.5 AAA (44px). 44px would make the mobile topbar taller again. Keep 40px?
4. **Lighthouse coverage.** `lighthouserc` doesn't test `/start-here/`, the heaviest page because of three.js. Consider adding it.
5. **Security.**
   - `curate-shortlist.yml` keeps `persist-credentials` at its default because it pushes the branch.
   - PRs opened with `GITHUB_TOKEN` don't trigger CI, so the auto-PR's "CI green" checkbox can't turn green by itself. That needs a PAT/App token or a manual re-push.
   - A meta CSP can't set `frame-ancestors`, so Pages can't block framing.
6. **Copy proposals not applied.**
   - Lifestyle: drop "actually"/"realmente", and PT "prova" becomes "evidência".
   - `site.js` PT title says "poliquística", but the scope is "quística".
   - `home.howUse` nearly duplicates `startHere.trackingBody`.
   - The mobile header shows the brand twice.
7. **WebKit e2e not run locally** (G6 abandoned). Check the WebKit job on the first CI run.

## Check results

Final run on the last code commit (`17dcd31`), one command at a time, with no other server on the test ports.

| Command                                                                                  | Exit | Result                                                                          |
| ---------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------- |
| `bun run build`                                                                          | 0    | `[11ty] Copied 11 Wrote 115 files`                                              |
| `bun run lint`                                                                           | 0    | oxlint clean                                                                    |
| `bun run test`                                                                           | 0    | `Tests 57 passed (57)`                                                          |
| `bun run format:check`                                                                   | 0    | `All matched files use the correct format.`                                     |
| `bunx playwright test --workers=1` on chromium-desktop, chromium-mobile, firefox-desktop | 0    | `378 passed (4.4m)`                                                             |
| `bun run test:lighthouse`                                                                | 0    | Assertions passed. Home, digest and PT digest each score 100 / 100 / 100 / 100. |

**`bun run test:e2e` with all four projects.** On `65642b2` it exited 1 with 391 passed and 113 failed. All 113 failures were `e2e-webkit-desktop`, and each one was the same launch error: "Host system is missing dependencies to run browsers". No WebKit test ran. CI installs the libraries with `--with-deps`.

**A false alarm along the way.** A later four-project run also showed 41 Chromium and Firefox timeouts. The cause was a stale `eleventy --serve` on port 8901, left behind when the gate checker killed a timed-out e2e command. Locally, Playwright reuses an existing server (`reuseExistingServer: !process.env.CI`), so tests hit a server pinned at 85% CPU. Once that process was killed, the clean single-worker run above passed 378 of 378.

Lighthouse detail on `65642b2`: LCP 1353 ms on home and 1502 ms on both digest pages, CLS 0, TBT 0 ms.

## Process note

One mistake was made and fixed before the end. The search pathPrefix fix was first committed without its template change. A failed `sed` match combined with a truncated test summary hid the 2 failing tests. The template fix was then folded into `3b90fae` with an autosquash rebase, before anything left this machine. The pre-commit hook ran the unit tests on every commit. The full e2e suite was run on the final commit, not on each intermediate one.
