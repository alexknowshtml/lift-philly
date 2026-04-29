#!/usr/bin/env node
/**
 * LIFT Philly Translation Importer
 *
 * Reads a translated CSV and upserts values into the lang JSON file.
 * Only updates rows where the lang column is non-empty.
 * Preserves keys already in the JSON that aren't in the CSV.
 *
 * Usage:
 *   node scripts/import-translations.js --page=index --lang=es --file=translations/export/index.csv
 *   node scripts/import-translations.js --page=index --lang=es
 *     (defaults to translations/export/index-es.csv, then translations/export/index.csv)
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const ROOT = path.join(__dirname, '..');
const LANGUAGES = ['es', 'zh', 'vi'];

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseCsv(content) {
  return parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true });
}

/**
 * Set a nested key value using dot notation.
 * e.g. setKey(obj, 'nav.home', 'Inicio') sets obj.nav.home = 'Inicio'
 */
function getKey(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

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

// Parse CLI args
const args = process.argv.slice(2);
const pageArg = args.find(a => a.startsWith('--page='))?.split('=')[1];
const langArg = args.find(a => a.startsWith('--lang='))?.split('=')[1];
const fileArg = args.find(a => a.startsWith('--file='))?.split('=')[1];
const onlyEmpty = args.includes('--only-empty');

if (!pageArg || !langArg) {
  console.error('Usage: node scripts/import-translations.js --page=<page> --lang=<lang> [--file=<csv>] [--only-empty]');
  process.exit(1);
}

if (!LANGUAGES.includes(langArg)) {
  console.error(`Unknown language: ${langArg}. Valid: ${LANGUAGES.join(', ')}`);
  process.exit(1);
}

// Resolve CSV path
let csvPath;
if (fileArg) {
  csvPath = path.resolve(ROOT, fileArg);
} else {
  const withLang = path.join(ROOT, 'translations', 'export', `${pageArg}-${langArg}.csv`);
  const generic = path.join(ROOT, 'translations', 'export', `${pageArg}.csv`);
  csvPath = fs.existsSync(withLang) ? withLang : generic;
}

if (!fs.existsSync(csvPath)) {
  console.error(`CSV not found: ${csvPath}`);
  console.error(`Run export first: node scripts/export-translations.js --page=${pageArg}`);
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
if (rows.length === 0) {
  console.error('CSV is empty or has no data rows.');
  process.exit(1);
}

if (!rows[0].hasOwnProperty(langArg)) {
  console.error(`CSV has no column for language: ${langArg}`);
  console.error(`Available columns: ${Object.keys(rows[0]).join(', ')}`);
  process.exit(1);
}

// Load existing lang JSON
const outPath = path.join(ROOT, 'translations', langArg, `${pageArg}.json`);
const existing = loadJson(outPath);

let updated = 0;
let skipped = 0;
let protected_ = 0;

for (const row of rows) {
  const key = row['key'];
  const val = row[langArg];
  if (!key) continue;
  if (!val || val.trim() === '') {
    skipped++;
    continue;
  }
  if (onlyEmpty) {
    const existing_val = getKey(existing, key);
    if (existing_val && String(existing_val).trim() !== '') {
      protected_++;
      continue;
    }
  }
  setKey(existing, key, val);
  updated++;
}

// Ensure output dir exists
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(outPath, JSON.stringify(existing, null, 2) + '\n');

console.log(`Imported ${langArg}/${pageArg}.json`);
console.log(`  Updated:   ${updated} keys`);
console.log(`  Skipped:   ${skipped} empty keys`);
if (onlyEmpty) console.log(`  Protected: ${protected_} keys (already had values)`);
console.log(`  Output:    translations/${langArg}/${pageArg}.json`);
