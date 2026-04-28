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
- `scripts/import-translations.js` -- reads filled CSV, writes back to per-language JSON (TODO)
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

### IN PROGRESS -- Phase 3: action page

#### 3a. `action/index.html` shell -- NEXT UP

3 static strings unannotated in the HTML shell:
- eyebrow div: "Take Action" -> data-i18n="hero.eyebrow"
- h1: "Talk to Your Council Member" -> data-i18n="hero.title"
- p subtitle: "Answer a few questions..." -> data-i18n="hero.subtitle"
- iframe title: "Council Advocacy Guide" -> data-i18n-attr-title="hero.embed_title"

Also add { source: 'action/index.html', page: 'action' } to PAGES in:
- scripts/extract-translations.js
- scripts/audit-unannotated.js

Then run extract to generate translations/en/action.json.

#### 3b. `action/embed/index.html` -- JS-driven wizard

- 748 lines, multi-step wizard, all strings in JS template literals
- data-i18n attributes won't work here (content dynamically injected via JS)
- Approach: externalize strings to a const T = { ... } translation object at top of script
- JS references T.key instead of hardcoded strings
- At runtime, load correct T object based on ?lang= query param or window.CURRENT_LANG
- Estimated keys: ~40-60 strings across step labels, button text, field labels, error messages

### TODO -- Phase 4: Translator handoff
- scripts/import-translations.js -- read filled CSV, write back to per-language JSON files
- Generate export CSVs for all pages (action will be new after 3a completes)
- Send to translators with instructions

### TODO -- Phase 5: Generate translated HTML + merge
- Run generator for all pages x 3 languages
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
