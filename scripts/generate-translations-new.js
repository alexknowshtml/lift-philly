#!/usr/bin/env node
/**
 * LIFT Philly Translation Generator (v2 — data-i18n attribute approach)
 *
 * Reads English HTML files (annotated with data-i18n attributes), substitutes
 * translated strings from JSON files, and writes language-specific HTML output.
 *
 * Usage: node scripts/generate-translations-new.js [--lang es] [--page index]
 *
 * English HTML is the single source of truth for structure.
 * JSON files are the source of truth for translatable strings.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const LANGUAGES = ['es', 'zh', 'vi'];

const LANG_META = {
  es: { code: 'es', name: 'Español', htmlLang: 'es', dir: 'ltr' },
  zh: { code: 'zh-CN', name: '简体中文', htmlLang: 'zh-Hans', dir: 'ltr' },
  vi: { code: 'vi', name: 'Tiếng Việt', htmlLang: 'vi', dir: 'ltr' },
};

// Pages to generate: { sourceHtml, outputPath, translationPage }
const PAGES = [
  { source: 'index.html',              output: 'index.html',              page: 'index' },
  { source: 'filing-your-birt.html',   output: 'filing-your-birt.html',   page: 'birt' },
  { source: 'one-sheet.html',          output: 'one-sheet.html',          page: 'one-sheet' },
  { source: 'calculator/index.html',   output: 'calculator/index.html',   page: 'calculator' },
  { source: 'petition/index.html',     output: 'petition/index.html',     page: 'petition' },
  { source: 'hearings/index.html',     output: 'hearings/index.html',     page: 'hearings' },
  { source: 'explain/index.html',      output: 'explain/index.html',      page: 'explain' },
];

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Deep-merge translation objects. Page-level keys win over common keys.
 * Objects are merged recursively; arrays and scalars from page win.
 */
function mergeTranslations(common, page) {
  const result = {};
  const allKeys = new Set([...Object.keys(common), ...Object.keys(page)]);
  for (const key of allKeys) {
    const c = common[key];
    const p = page[key];
    if (c !== undefined && p !== undefined &&
        typeof c === 'object' && typeof p === 'object' &&
        !Array.isArray(c) && !Array.isArray(p)) {
      result[key] = mergeTranslations(c, p);
    } else {
      result[key] = p !== undefined ? p : c;
    }
  }
  return result;
}

/**
 * Get a nested key value from an object using dot notation.
 * e.g. getKey(obj, 'nav.home') returns obj.nav.home
 */
function getKey(obj, keyPath) {
  return keyPath.split('.').reduce((acc, k) => acc && acc[k], obj);
}

/**
 * Apply translations to a parsed cheerio document.
 */
function applyTranslations($, translations, lang) {
  const meta = LANG_META[lang];

  // Update html lang attribute
  $('html').attr('lang', meta.htmlLang);

  // data-i18n — replace textContent
  $('[data-i18n]').each((_, el) => {
    const key = $(el).attr('data-i18n');
    const val = getKey(translations, key);
    if (val !== undefined && val !== null) {
      $(el).text(val);
    } else {
      console.warn(`  [WARN] Missing key: ${key}`);
    }
  });

  // data-i18n-html — replace innerHTML
  $('[data-i18n-html]').each((_, el) => {
    const key = $(el).attr('data-i18n-html');
    const val = getKey(translations, key);
    if (val !== undefined && val !== null) {
      $(el).html(val);
    } else {
      console.warn(`  [WARN] Missing key (html): ${key}`);
    }
  });

  // data-i18n-attr-* — replace specific attributes
  $('[data-i18n-attr-placeholder]').each((_, el) => {
    const key = $(el).attr('data-i18n-attr-placeholder');
    const val = getKey(translations, key);
    if (val) $(el).attr('placeholder', val);
  });

  $('[data-i18n-attr-title]').each((_, el) => {
    const key = $(el).attr('data-i18n-attr-title');
    const val = getKey(translations, key);
    if (val) $(el).attr('title', val);
  });

  $('[data-i18n-attr-content]').each((_, el) => {
    const key = $(el).attr('data-i18n-attr-content');
    const val = getKey(translations, key);
    if (val) $(el).attr('content', val);
  });

  // Inject window.TRANSLATIONS for runtime JS use (calculator etc.)
  const translationsScript = `<script>window.TRANSLATIONS = ${JSON.stringify(translations)};</script>`;
  $('head').append(translationsScript);
}

/**
 * Generate one page for one language.
 */
function generatePage(lang, pageConfig) {
  const { source, output, page } = pageConfig;
  const meta = LANG_META[lang];

  const sourcePath = path.join(ROOT, source);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`  [SKIP] Source not found: ${source}`);
    return;
  }

  const commonT = loadJson(path.join(ROOT, 'translations', lang, 'common.json'));
  const pageT = loadJson(path.join(ROOT, 'translations', lang, `${page}.json`));
  const translations = mergeTranslations(commonT, pageT);

  const html = fs.readFileSync(sourcePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  applyTranslations($, translations, lang);

  // Write output
  const outputPath = path.join(ROOT, lang, output);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(outputPath, $.html());
  console.log(`  ✓ ${lang}/${output}`);
}

// Parse CLI args
const args = process.argv.slice(2);
const langArg = args.find(a => a.startsWith('--lang='))?.split('=')[1];
const pageArg = args.find(a => a.startsWith('--page='))?.split('=')[1];

const langsToRun = langArg ? [langArg] : LANGUAGES;
const pagesToRun = pageArg ? PAGES.filter(p => p.page === pageArg) : PAGES;

console.log('Generating translated pages (v2)...\n');

langsToRun.forEach(lang => {
  if (!LANG_META[lang]) {
    console.error(`Unknown language: ${lang}`);
    return;
  }
  console.log(`${LANG_META[lang].name} (${lang}):`);
  pagesToRun.forEach(p => generatePage(lang, p));
  console.log('');
});

console.log('Done.');
