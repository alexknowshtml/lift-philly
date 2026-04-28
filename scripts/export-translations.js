#!/usr/bin/env node
/**
 * LIFT Philly Translation Exporter
 *
 * Generates a CSV from English source JSON + existing lang JSONs.
 * Status column: "new" | "changed" | "ok" based on git diff of en/ file.
 *
 * Usage:
 *   node scripts/export-translations.js --page=index
 *   node scripts/export-translations.js --page=index --lang=es
 *   node scripts/export-translations.js --page=all
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LANGUAGES = ['es', 'zh', 'vi'];

const PAGES = ['common', 'index', 'birt', 'one-sheet', 'calculator', 'petition', 'hearings', 'explain'];

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Flatten a nested object into dot-notation key/value pairs.
 * e.g. { nav: { home: 'Home' } } → { 'nav.home': 'Home' }
 */
function flatten(obj, prefix = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flatten(v, key));
    } else {
      result[key] = v === null ? '' : String(v);
    }
  }
  return result;
}

/**
 * Get the last committed version of an en/ JSON file.
 * Returns {} if file has never been committed.
 */
function getCommittedEnglish(page) {
  const relPath = `translations/en/${page}.json`;
  try {
    const raw = execSync(`git show HEAD:${relPath}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return flatten(JSON.parse(raw));
  } catch {
    return {};
  }
}

/**
 * Escape a CSV field (wrap in quotes if it contains comma, newline, or quote).
 */
function csvField(val) {
  const s = val === undefined || val === null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportPage(page, langs) {
  const enPath = path.join(ROOT, 'translations', 'en', `${page}.json`);
  if (!fs.existsSync(enPath)) {
    console.warn(`  [SKIP] No en/${page}.json found`);
    return;
  }

  const enFlat = flatten(loadJson(enPath));
  const committedEn = getCommittedEnglish(page);

  // For non-common pages, skip keys already covered by common.json
  const commonKeys = page !== 'common'
    ? new Set(Object.keys(flatten(loadJson(path.join(ROOT, 'translations', 'en', 'common.json')))))
    : new Set();

  // Load existing lang translations (flattened)
  const langData = {};
  for (const lang of langs) {
    const p = path.join(ROOT, 'translations', lang, `${page}.json`);
    langData[lang] = flatten(loadJson(p));
  }

  // Build CSV rows
  const header = ['key', 'en', ...langs, 'status'];
  const rows = [header];

  for (const [key, enVal] of Object.entries(enFlat)) {
    if (commonKeys.has(key)) continue;
    const committed = committedEn[key];
    const langVals = langs.map(lang => langData[lang][key] ?? '');
    const anyMissing = langVals.some(v => v === '');
    let status;
    if (committed !== enVal) {
      // English changed (or key is brand-new in en/ history) — always needs work
      status = committed === undefined ? 'new' : 'changed';
    } else if (anyMissing) {
      // English stable but some lang still untranslated
      status = 'new';
    } else {
      status = 'ok';
    }
    rows.push([key, enVal, ...langVals, status]);
  }

  // Write CSV
  const exportDir = path.join(ROOT, 'translations', 'export');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  const suffix = langs.length === 1 ? `-${langs[0]}` : '';
  const outPath = path.join(exportDir, `${page}${suffix}.csv`);
  const csv = rows.map(r => r.map(csvField).join(',')).join('\n');
  fs.writeFileSync(outPath, csv + '\n');

  const newCount = rows.slice(1).filter(r => r[r.length - 1] === 'new').length;
  const changedCount = rows.slice(1).filter(r => r[r.length - 1] === 'changed').length;
  console.log(`  ✓ translations/export/${page}${suffix}.csv  (${newCount} new, ${changedCount} changed)`);
}

// Parse CLI args
const args = process.argv.slice(2);
const pageArg = args.find(a => a.startsWith('--page='))?.split('=')[1];
const langArg = args.find(a => a.startsWith('--lang='))?.split('=')[1];

const pages = pageArg === 'all' ? PAGES : (pageArg ? [pageArg] : PAGES);
const langs = langArg ? [langArg] : LANGUAGES;

console.log('Exporting translation CSVs...\n');
for (const page of pages) {
  exportPage(page, langs);
}
console.log('\nDone. Send CSV to translators — they fill in their language column(s).');
console.log('Status key: new=needs translation, changed=English changed, ok=skip');
