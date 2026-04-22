#!/usr/bin/env node
/**
 * Generate PDFs from one-sheet HTML pages using Playwright
 *
 * Usage: node scripts/generate-pdfs.js
 *
 * Generates:
 *   /one-sheet.pdf        - English
 *   /es/one-sheet.pdf     - Spanish
 *   /zh/one-sheet.pdf     - Chinese (Simplified)
 *   /vi/one-sheet.pdf     - Vietnamese
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LANGUAGES = [
  { lang: 'en', name: 'English', htmlPath: 'one-sheet.html', pdfPath: 'one-sheet.pdf' },
  { lang: 'es', name: 'Español', htmlPath: 'es/one-sheet.html', pdfPath: 'es/one-sheet.pdf' },
  { lang: 'zh', name: '简体中文', htmlPath: 'zh/one-sheet.html', pdfPath: 'zh/one-sheet.pdf' },
  { lang: 'vi', name: 'Tiếng Việt', htmlPath: 'vi/one-sheet.html', pdfPath: 'vi/one-sheet.pdf' },
];

async function generatePdf(browser, { lang, name, htmlPath, pdfPath }) {
  const resolvedHtml = path.resolve(__dirname, '..', htmlPath);
  const resolvedPdf = path.resolve(__dirname, '..', pdfPath);

  if (!fs.existsSync(resolvedHtml)) {
    console.log(`  ✗ ${htmlPath} not found, skipping`);
    return false;
  }

  const page = await browser.newPage();
  await page.goto(`file://${resolvedHtml}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: resolvedPdf,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await page.close();
  console.log(`  ✓ ${pdfPath}`);
  return true;
}

async function main() {
  console.log('Generating PDFs from one-sheets...\n');
  const browser = await chromium.launch();

  for (const entry of LANGUAGES) {
    console.log(`Processing ${entry.name} (${entry.lang})...`);
    try {
      await generatePdf(browser, entry);
    } catch (err) {
      console.error(`  ✗ Error generating ${entry.lang} PDF:`, err.message);
    }
  }

  await browser.close();
  console.log('\nDone! PDFs generated for all languages.');
}

main().catch(console.error);
