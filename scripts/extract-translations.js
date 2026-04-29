#!/usr/bin/env node
/**
 * LIFT Philly Translation Extractor
 *
 * Reads an English HTML file (annotated with data-i18n attributes) and
 * extracts translatable strings into translations/en/{page}.json.
 *
 * Run after editing English copy to keep en/*.json in sync with the HTML.
 *
 * Usage: node scripts/extract-translations.js [--page index]
 *
 * All pages are processed if --page is omitted.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  { sources: ['_includes/nav.html', '_includes/footer.html'], page: 'common' },
  { source: 'index.html',            page: 'index' },
  { source: 'filing-your-birt.html', page: 'birt' },
  { source: 'one-sheet.html',        page: 'one-sheet' },
  { source: 'calculator/index.html', page: 'calculator' },
  { source: 'petition/index.html',   page: 'petition' },
  { source: 'hearings/index.html',   page: 'hearings' },
  { source: 'explain/index.html',    page: 'explain' },
  { source: 'action/index.html',       page: 'action' },
  { source: 'action/embed/index.html', page: 'action-embed' },
];

function setKey(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] === undefined || typeof cur[parts[i]] !== 'object') {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function extractPage(pageConfig) {
  const { source, sources, page } = pageConfig;

  let html;
  if (sources) {
    html = sources.map(s => {
      const p = path.join(ROOT, s);
      if (!fs.existsSync(p)) { console.warn(`  [SKIP] Not found: ${s}`); return ''; }
      return fs.readFileSync(p, 'utf8');
    }).join('\n');
  } else {
    const sourcePath = path.join(ROOT, source);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`  [SKIP] Not found: ${source}`);
      return;
    }
    html = fs.readFileSync(sourcePath, 'utf8');
  }
  const $ = cheerio.load(html, { decodeEntities: false });

  const extracted = {};
  let count = 0;

  $('[data-i18n]').each((_, el) => {
    const key = $(el).attr('data-i18n');
    const val = $(el).text().trim();
    setKey(extracted, key, val);
    count++;
  });

  $('[data-i18n-html]').each((_, el) => {
    const key = $(el).attr('data-i18n-html');
    const val = $(el).html().trim();
    setKey(extracted, key, val);
    count++;
  });

  $('[data-i18n-attr-content]').each((_, el) => {
    const key = $(el).attr('data-i18n-attr-content');
    const val = $(el).attr('content') || '';
    setKey(extracted, key, val);
    count++;
  });

  $('[data-i18n-attr-placeholder]').each((_, el) => {
    const key = $(el).attr('data-i18n-attr-placeholder');
    const val = $(el).attr('placeholder') || '';
    setKey(extracted, key, val);
    count++;
  });

  $('[data-i18n-attr-title]').each((_, el) => {
    const key = $(el).attr('data-i18n-attr-title');
    const val = $(el).attr('title') || '';
    setKey(extracted, key, val);
    count++;
  });

  $('[data-i18n-attr-aria-label]').each((_, el) => {
    const key = $(el).attr('data-i18n-attr-aria-label');
    const val = $(el).attr('aria-label') || '';
    setKey(extracted, key, val);
    count++;
  });

  $('[data-i18n-attr-alt]').each((_, el) => {
    const key = $(el).attr('data-i18n-attr-alt');
    const val = $(el).attr('alt') || '';
    setKey(extracted, key, val);
    count++;
  });

  // Compare with existing en JSON to report orphaned keys
  const outPath = path.join(ROOT, 'translations', 'en', `${page}.json`);
  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const orphans = findOrphans(existing, extracted, '');
    if (orphans.length > 0) {
      console.warn(`  [WARN] Keys in existing JSON not found in HTML (orphaned):`);
      orphans.forEach(k => console.warn(`    - ${k}`));
    }
  }

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(extracted, null, 2) + '\n');
  console.log(`  ✓ translations/en/${page}.json (${count} keys)`);
}

function findOrphans(existing, extracted, prefix) {
  const orphans = [];
  for (const key of Object.keys(existing)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof existing[key] === 'object' && !Array.isArray(existing[key])) {
      const sub = (typeof extracted[key] === 'object') ? extracted[key] : {};
      orphans.push(...findOrphans(existing[key], sub, fullKey));
    } else {
      // extracted is already the sub-object at the current depth — just check the key directly
      if (extracted[key] === undefined) orphans.push(fullKey);
    }
  }
  return orphans;
}

// Parse CLI args
const args = process.argv.slice(2);
const pageArg = args.find(a => a.startsWith('--page='))?.split('=')[1];
const pagesToRun = pageArg ? PAGES.filter(p => p.page === pageArg) : PAGES;

console.log('Extracting English translations from HTML...\n');
pagesToRun.forEach(extractPage);
console.log('\nDone. Commit translations/en/ after reviewing changes.');
