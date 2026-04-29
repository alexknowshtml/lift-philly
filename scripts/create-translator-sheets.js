#!/usr/bin/env node
/**
 * LIFT Philly Translator Sheet Builder
 *
 * Creates (or rebuilds) three Google Sheets — one per language (es, zh, vi) —
 * each with 10 tabs (one per page). Each tab shows only untranslated rows
 * (status=new) with columns: key | English | [Language].
 *
 * Requires: gog CLI authenticated with Google account
 *
 * Usage:
 *   node scripts/create-translator-sheets.js
 *     → Creates new sheets, prints URLs
 *
 *   node scripts/create-translator-sheets.js --rebuild
 *     → Rebuilds existing sheets (requires SHEET_IDS set below)
 *
 * After creating sheets for the first time, copy the IDs into SHEET_IDS.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GOG = path.join(__dirname, '..', '..', 'andy', 'scripts', 'gog-wrapper.sh');
const EXPORT_DIR = path.join(__dirname, '..', 'translations', 'export');
const PAGES = [
  'common', 'index', 'birt', 'one-sheet', 'calculator',
  'petition', 'hearings', 'explain', 'action', 'action-embed',
];

// Fill these in after first run to enable --rebuild
const SHEET_IDS = {
  es: '1CBoebhKNcCGKKsOf9GvL6DoPu0BZr3aZQnQnRgfnXB4',
  zh: '18nRJShNVeLgAhShS29skmE4Q9rALU35Ojps0hYhGgzs',
  vi: '1j5nI_ggJOqw1XbCk420KnF44bzkcCyFJMKxVOJ5VibM',
};

const LANGS = [
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Chinese' },
  { code: 'vi', name: 'Vietnamese' },
];

// Single-pass CSV parser — handles quoted fields with embedded commas and newlines
function parseCsv(text) {
  const rows = [];
  let fields = [], field = '', inQuote = false, i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; }
        else { inQuote = false; i++; }
      } else { field += ch; i++; }
    } else {
      if (ch === '"') { inQuote = true; i++; }
      else if (ch === ',') { fields.push(field); field = ''; i++; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        fields.push(field); field = '';
        if (fields.some(f => f !== '') || rows.length === 0) rows.push(fields);
        fields = []; i++;
      } else { field += ch; i++; }
    }
  }
  if (field || fields.length > 0) {
    fields.push(field);
    if (fields.some(f => f !== '')) rows.push(fields);
  }
  return rows;
}

// Prefix values that Sheets would interpret as formulas
function safeValue(v) {
  return (v && /^[=+\-@]/.test(v)) ? "'" + v : (v ?? '');
}

function gog(args) {
  return execSync(`${GOG} ${args}`, { stdio: 'pipe', encoding: 'utf8' });
}

const rebuild = process.argv.includes('--rebuild');
const urls = {};

for (const lang of LANGS) {
  console.log(`\n=== ${lang.name} ===`);

  let sheetId;
  if (rebuild && SHEET_IDS[lang.code]) {
    sheetId = SHEET_IDS[lang.code];
    console.log(`  Using existing sheet: ${sheetId}`);
  } else {
    const result = JSON.parse(gog(`sheets create "LIFT Philly Translations — ${lang.name}" -j`));
    sheetId = result.spreadsheetId;
    urls[lang.code] = result.spreadsheetUrl;
    console.log(`  Created: ${sheetId}`);
  }

  for (let pi = 0; pi < PAGES.length; pi++) {
    const page = PAGES[pi];
    const csvPath = path.join(EXPORT_DIR, `${page}.csv`);
    if (!fs.existsSync(csvPath)) {
      console.log(`  SKIP: ${page} (no CSV — run export-translations.js first)`);
      continue;
    }

    const allRows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    const headers = allRows[0];
    const enIdx = headers.indexOf('en');
    const langIdx = headers.indexOf(lang.code);
    const statusIdx = headers.indexOf('status');

    const rows = [['key', 'English', lang.name]];
    for (const row of allRows.slice(1)) {
      if (row[statusIdx] === 'ok') continue;
      rows.push([safeValue(row[0]), safeValue(row[enIdx]), safeValue(row[langIdx])]);
    }

    // Delete and recreate tab (except first tab which was auto-created)
    if (pi === 0) {
      // First page: rename the default Sheet1 (or keep if already named)
      try { gog(`sheets rename-tab "${sheetId}" "Sheet1" "${page}"`); } catch (e) { /* already renamed */ }
    } else {
      try { gog(`sheets delete-tab "${sheetId}" "${page}" --force`); } catch (e) { /* tab may not exist */ }
      gog(`sheets add-tab "${sheetId}" "${page}"`);
    }

    const tmpFile = `/tmp/lift-${lang.code}-${page}.json`;
    fs.writeFileSync(tmpFile, JSON.stringify(rows));
    gog(`sheets update "${sheetId}" "${page}!A1" --values-json "$(cat ${tmpFile})" --input=RAW`);
    console.log(`  ✓ ${page} — ${rows.length - 1} rows`);
  }

  if (!rebuild) {
    urls[lang.code] = urls[lang.code] || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  }
}

console.log('\n=== Sheet URLs ===');
for (const lang of LANGS) {
  const url = urls[lang.code] || `https://docs.google.com/spreadsheets/d/${SHEET_IDS[lang.code]}/edit`;
  console.log(`${lang.name}: ${url}`);
}
