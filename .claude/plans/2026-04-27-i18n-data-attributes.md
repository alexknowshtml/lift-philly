# Plan: i18n data-attributes Refactor

**Date:** 2026-04-27 (updated 2026-04-28)  
**Branch:** `i18n-simplify`  
**Goal:** Full data-i18n annotation of all pages so human translators can work from CSV exports. English HTML = structural source of truth. No more baked-in generator templates.

## The Problem

The old `generate-translations.js` had its own copy of each page's HTML baked into JS. When English pages were updated, the generator didn't follow. Translated pages were missing 30-50% of content.

## The Solution

Add `data-i18n="section.key"` attributes to translatable text nodes in the English HTML. A new extractor reads the English HTML and writes `translations/en/{page}.json`. Translators receive CSV exports and return filled-in CSVs. A generator substitutes strings back into the English HTML to produce language-specific output files.

## Attribute Conventions

- `data-i18n="key"` -- replace textContent (plain text)
- `data-i18n-html="key"` -- replace innerHTML (strings with strong, br, span etc.)
- `data-i18n-attr-content="key"` -- replace content attribute (meta tags)
- `data-i18n-attr-placeholder="key"` -- replace placeholder attribute (form inputs)
- `data-i18n-attr-title="key"` -- replace title attribute (iframes, images)
- `data-i18n-attr-alt="key"` -- replace alt attribute (images)

## Key Naming Convention

`{section}.{element}` e.g. `hero.title`, `nav.home`  
Shared strings: `translations/en/common.json` (nav, footer, language switcher)  
Page-specific strings: `translations/en/{page}.json`

## Tooling

- `scripts/extract-translations.js` -- reads annotated HTML, writes `translations/en/{page}.json`
- `scripts/audit-unannotated.js` -- scans pages for unannotated text; exits 1 if issues found
- `scripts/export-translations.js` -- generates CSV per page: key | en | es | zh | vi | status
- `scripts/import-translations.js` -- reads filled CSV, writes back to per-language JSON (NEXT UP)
- `scripts/generate-translations-new.js` -- substitutes strings from JSON into English HTML (TODO)

---

## Status

### DONE -- Phase 1: Setup & Tooling
- Branch `i18n-simplify` created
- `cheerio` installed
- `scripts/extract-translations.js` written and working
- `scripts/audit-unannotated.js` written; SKIP_CONTAINERS tuned (.nav-translate, .nav-brand, .footer-brand, .logo, [data-i18n-html], .social-share, .last-updated)
- `scripts/export-translations.js` written; status bug fixed (anyMissing check added)
- `translations/en/common.json` created (nav, footer, language switcher)

### DONE -- Phase 2: Annotate all original pages

| Page | Keys | Notes |
|------|------|-------|
| `index.html` | ~80 | LIFT wordmark + easter egg given .logo class to suppress audit FPs |
| `filing-your-birt.html` | ~60 | -- |
| `one-sheet.html` | ~55 | -- |
| `calculator/index.html` | 56 | Submodule (liftphilly/philly-business-tax-calculator); .social-share class added; committed to submodule main |
| `petition/index.html` | ~45 | -- |
| `hearings/index.html` | ~50 | -- |
| `explain/index.html` | 105 | Includes "Why a Law", "What Can You Do", closing manifesto, CTA |

Audit passes clean (node scripts/audit-unannotated.js exits 0) for all 7 pages.
Extract runs clean for all 7 pages.
Export CSVs generated; status correctly marks missing translations as `new`.

### DONE -- Phase 3: action page

#### 3a. `action/index.html` shell
- 21 keys extracted to `translations/en/action.json`
- Annotated: hero.eyebrow, hero.title, hero.subtitle, hero.embed_title (iframe title attr)
- audit-unannotated.js and extract-translations.js PAGES arrays updated

#### 3b. `action/embed/index.html` -- JS-driven wizard
- 32 keys extracted to `translations/en/action-embed.json`
- Static HTML annotated with data-i18n for all screen headings, buttons, and labels
- `const T = { ... }` object inserted before `const COUNCIL_MEMBERS`; covers all user-visible strings dynamically injected via JS: landing, nav buttons, interview questions (q[] array), action picker, email template functions, phone script functions, testify (hearings array + beat labels), support screen
- `INTERVIEW_QS` refactored to pull question/placeholder/hint from `T.interview.q[*]`
- `renderInterview`: progress => `T.interview.progress(n, total)`, hint => `T.interview.optional_hint`, next/final button text from `T.nav`
- Runtime language switching: pass `?lang=es` in iframe src at Phase 5; T object is self-contained
- Zero hardcoded UI strings remain

All 9 pages audit clean. Committed and pushed to `i18n-simplify`.

### IN PROGRESS -- Phase 4: Translator handoff

#### 4a. `scripts/import-translations.js` -- NEXT UP
- Read translator-filled CSV (key | en | es | zh | vi | status columns)
- For each non-English language column, write `translations/{lang}/{page}.json`
- Should mirror the nested key structure written by extract-translations.js
- Report count of keys written per language

#### 4b. Export CSVs for all 9 pages
- Run `node scripts/export-translations.js` after import script is done
- Verify all pages have CSVs in `translations/export/`
- Pages: common, index, birt, one-sheet, calculator, petition, hearings, explain, action, action-embed

#### 4c. Send to translators
- Bundle CSVs
- Send with instructions (fill columns, leave key column untouched)

### TODO -- Phase 5: Generate translated HTML + merge
- Write/finish `scripts/generate-translations-new.js`
- Run generator for all pages x 3 languages (es, zh-CN, vi)
- Pass `?lang={code}` in action/index.html iframe src per language
- Spot-check each language dir
- git push origin i18n-simplify
- Alex reviews on branch, approves merge to main

---

## Safety Rules

- Never touch main until Phase 5 is approved
- data-i18n attributes are invisible to browsers -- adding them is non-breaking
- Generator only writes to language subdirs, never to English source files
- English HTML is the only structural source of truth -- JSON only holds strings
- Calculator submodule changes go to liftphilly/philly-business-tax-calculator main, then parent repo submodule pointer updated on i18n-simplify
