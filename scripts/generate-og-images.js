#!/usr/bin/env node
/**
 * Generate OG images from SVG files using Playwright
 *
 * Usage: node scripts/generate-og-images.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const IMAGES = [
  { svg: 'og-image.svg', png: 'og-image.png' },
  { svg: 'og-petition.svg', png: 'og-petition.png' },
  { svg: 'og-simulator.svg', png: 'og-simulator.png' },
];

async function generateImage(browser, svgFile, pngFile) {
  const svgPath = path.resolve(__dirname, '..', svgFile);
  const pngPath = path.resolve(__dirname, '..', pngFile);

  if (!fs.existsSync(svgPath)) {
    console.log(`  ✗ ${svgFile} not found, skipping`);
    return false;
  }

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(`file://${svgPath}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: pngPath, type: 'png' });
  await page.close();

  console.log(`  ✓ ${pngFile}`);
  return true;
}

async function main() {
  console.log('Generating OG images...');
  const browser = await chromium.launch();

  for (const { svg, png } of IMAGES) {
    await generateImage(browser, svg, png);
  }

  await browser.close();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
