#!/usr/bin/env node
/**
 * LIFT Philly i18n Annotation Auditor
 *
 * Scans HTML pages for user-visible text elements that are missing data-i18n
 * attributes. Run before translator handoffs to catch unannotated copy.
 *
 * Usage: node scripts/audit-unannotated.js [--page index]
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  { source: 'index.html',            page: 'index' },
  { source: 'filing-your-birt.html', page: 'birt' },
  { source: 'one-sheet.html',        page: 'one-sheet' },
  { source: 'calculator/index.html', page: 'calculator' },
  { source: 'petition/index.html',   page: 'petition' },
  { source: 'hearings/index.html',   page: 'hearings' },
  { source: 'explain/index.html',    page: 'explain' },
];

// Tags whose text content is always user-visible and should be annotated
const TEXT_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','li','td','th','label','button','a','span','div','strong','em','blockquote','figcaption','caption','dt','dd']);

// Tags to skip entirely (no visible text expected)
const SKIP_TAGS = new Set(['script','style','noscript','meta','link','head','svg','path','circle','rect','line','polyline','polygon','template','code','pre']);

// Attributes that carry visible text
const TEXT_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

// CSS selectors for containers whose text is intentionally not translated
const SKIP_CONTAINERS = [
  '.nav-translate',   // language switcher buttons (names are already in target lang)
  '.nav-brand',       // brand name
  '.footer-brand',    // brand name
  '.logo',            // brand name in print documents
  '[data-i18n-html]', // parent annotated as HTML — children covered by parent
];

function hasI18n(el, $) {
  return $(el).attr('data-i18n') || $(el).attr('data-i18n-html') ||
    TEXT_ATTRS.some(a => $(el).attr(`data-i18n-attr-${a}`));
}

// Returns true if the element is inside a container we intentionally skip
function inSkipContainer($el, $) {
  return SKIP_CONTAINERS.some(sel => $el.closest(sel).length > 0);
}

// Returns true if text looks like a number, symbol, or year (not translatable)
function isNonTranslatableText(text) {
  return /^[\d\s$%<>.,+\-–—:;!?'"()\[\]\/\\]+$/.test(text);
}

function auditPage({ source, page }) {
  const sourcePath = path.join(ROOT, source);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`  [SKIP] Not found: ${source}`);
    return 0;
  }

  const html = fs.readFileSync(sourcePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  const issues = [];

  // Find text-bearing elements without data-i18n
  TEXT_TAGS.forEach(tag => {
    $(tag).each((_, el) => {
      const $el = $(el);
      if ($el.closest(Array.from(SKIP_TAGS).join(',')).length) return;
      if (inSkipContainer($el, $)) return;
      if (hasI18n(el, $)) return;
      const directText = $el.contents()
        .filter((_, n) => n.type === 'text' && n.data.trim().length > 3)
        .map((_, n) => n.data.trim()).get();
      if (directText.length === 0) return;
      const text = directText.join(' ');
      if (isNonTranslatableText(text)) return;
      issues.push({ tag, text: text.substring(0, 80) });
    });
  });

  // Check text attributes
  TEXT_ATTRS.forEach(attr => {
    $(`[${attr}]`).each((_, el) => {
      const val = $(el).attr(attr);
      if (!val || val.length <= 3) return;
      if ($(el).attr(`data-i18n-attr-${attr}`)) return;
      if ($(el).closest(Array.from(SKIP_TAGS).join(',')).length) return;
      if (inSkipContainer($(el), $)) return;
      issues.push({ tag: `[${attr}]`, text: val.substring(0, 80) });
    });
  });

  if (issues.length === 0) {
    console.log(`  ✓ ${page}: no unannotated text found`);
  } else {
    console.log(`  ⚠ ${page}: ${issues.length} element(s) missing data-i18n:`);
    issues.forEach(({ tag, text }) => console.log(`    <${tag}> "${text}"`));
  }

  return issues.length;
}

const args = process.argv.slice(2);
const pageArg = args.find(a => a.startsWith('--page='))?.split('=')[1];
const pagesToRun = pageArg ? PAGES.filter(p => p.page === pageArg) : PAGES;

console.log('Auditing for unannotated translatable text...\n');
const total = pagesToRun.reduce((sum, p) => sum + auditPage(p), 0);
console.log(`\n${total === 0 ? 'All clear.' : `${total} issue(s) found. Add data-i18n attributes, then re-run extract-translations.js.`}`);
process.exit(total > 0 ? 1 : 0);
