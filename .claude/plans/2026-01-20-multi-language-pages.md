# LIFT Philly Multi-Language Pages Plan

**Date:** 2026-01-20
**Status:** Approved

## Overview

Add native-language translation pages for LIFT Philly's core pages in Spanish, Chinese (Simplified), and Vietnamese - the top 3 non-English languages in Philadelphia by speaker population.

## Language Selection Rationale

Based on Philadelphia Census data:
- **Spanish (es):** 166,348 speakers - clear #1
- **Chinese (zh):** 31,410 speakers - established Chinatown community
- **Vietnamese (vi):** 12,974 speakers - growing community

## Scope

### Pages to Translate (4 total)
1. **Homepage** (`index.html`) - ~2,500 text strings
2. **BIRT Filing Guide** (`filing-your-birt.html`) - ~1,200 text strings
3. **Tax Calculator** (`calculator/index.html`) - ~800 text strings
4. **One-Pager** (`one-sheet.html`) - generates PDF

### Deliverables
- 12 translated HTML pages (4 pages × 3 languages)
- 3 translated PDFs (one-pager per language)

## URL Structure

```
Spanish:
/es/                → Homepage
/es/birt/           → BIRT Filing Guide
/es/calculator/     → Tax Calculator
/es/one-sheet/      → One-pager (HTML for PDF generation)
/one-sheet-es.pdf   → Spanish PDF

Chinese (Simplified):
/zh/                → Homepage
/zh/birt/           → BIRT Filing Guide
/zh/calculator/     → Tax Calculator
/zh/one-sheet/      → One-pager
/one-sheet-zh.pdf   → Chinese PDF

Vietnamese:
/vi/                → Homepage
/vi/birt/           → BIRT Filing Guide
/vi/calculator/     → Tax Calculator
/vi/one-sheet/      → One-pager
/vi/one-sheet.pdf   → Vietnamese PDF
```

## Translation Approach

**Method:** AI-generated translations with native speaker review

### Process
1. Extract translatable strings from each HTML file
2. Generate AI translations with tax/legal terminology context
3. Create JSON translation files per language for maintainability
4. Generate language-specific HTML files
5. Generate PDFs from translated one-sheet HTML
6. Deploy pages at URLs (unlinked from main navigation)
7. Share direct URLs with native speakers for review
8. Upon approval, add language selector to main navigation
9. Add `hreflang` tags for SEO

## Technical Implementation

### Translation File Structure
```
/translations/
  /es/
    index.json
    birt.json
    calculator.json
    one-sheet.json
  /zh/
    ...
  /vi/
    ...
```

### Build Process
1. English HTML remains source of truth
2. Translation JSON files contain string mappings
3. Build script generates language-specific HTML
4. Same PDF generation workflow for all languages

### Deployment Strategy
1. Pages deployed but not linked (hidden)
2. Direct URLs shared with reviewers
3. Language selector added to nav after approval
4. `hreflang` tags added for search engines

## Implementation Steps

### Phase 1: Setup & Extraction
- [ ] Create `/translations/` directory structure
- [ ] Extract translatable strings from `index.html` to JSON
- [ ] Extract strings from `filing-your-birt.html`
- [ ] Extract strings from `calculator/index.html`
- [ ] Extract strings from `one-sheet.html`

### Phase 2: Translation Generation
- [ ] Generate Spanish translations with AI
- [ ] Generate Chinese (Simplified) translations
- [ ] Generate Vietnamese translations
- [ ] Review for tax/legal terminology accuracy

### Phase 3: Page Creation
- [ ] Create `/es/` directory and pages
- [ ] Create `/zh/` directory and pages
- [ ] Create `/vi/` directory and pages
- [ ] Generate translated PDFs

### Phase 4: Deployment & Review
- [ ] Deploy to Netlify (unlinked)
- [ ] Share URLs with native speaker reviewers
- [ ] Collect and incorporate feedback
- [ ] Final review pass

### Phase 5: Launch
- [ ] Add language selector to main navigation
- [ ] Add `hreflang` tags to all pages
- [ ] Update sitemap
- [ ] Announce availability

## Notes

- Current Google Translate integration will remain as fallback for other languages
- Tax calculator JavaScript logic is language-agnostic; only UI strings need translation
- Coalition tracker (internal tool) excluded from scope
