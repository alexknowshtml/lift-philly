#!/usr/bin/env node
/**
 * Generate PDFs from translated one-sheet HTML pages using Playwright
 *
 * Usage: node scripts/generate-pdfs.js
 *
 * Generates:
 *   /es/one-sheet.pdf - Spanish
 *   /zh/one-sheet.pdf - Chinese (Simplified)
 *   /vi/one-sheet.pdf - Vietnamese
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LANGUAGES = ['es', 'zh', 'vi'];
const LANG_NAMES = {
  es: 'Español',
  zh: '简体中文',
  vi: 'Tiếng Việt'
};

async function generatePdf(browser, lang) {
  const htmlPath = path.resolve(__dirname, `../${lang}/one-sheet.html`);
  const pdfPath = path.resolve(__dirname, `../${lang}/one-sheet.pdf`);

  if (!fs.existsSync(htmlPath)) {
    console.log(`  ✗ ${lang}/one-sheet.html not found, skipping`);
    return false;
  }

  const page = await browser.newPage();

  // Load the HTML file
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  // Generate PDF with print-friendly settings
  // The one-sheet is designed for US Letter, 2 pages
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    }
  });

  await page.close();
  console.log(`  ✓ ${lang}/one-sheet.pdf`);
  return true;
}

async function main() {
  console.log('Generating PDFs from translated one-sheets...\n');

  const browser = await chromium.launch();

  for (const lang of LANGUAGES) {
    console.log(`Processing ${LANG_NAMES[lang]} (${lang})...`);
    try {
      await generatePdf(browser, lang);
    } catch (err) {
      console.error(`  ✗ Error generating ${lang} PDF:`, err.message);
    }
  }

  await browser.close();

  console.log('\nDone! PDFs generated for all languages.');
}

main().catch(console.error);
