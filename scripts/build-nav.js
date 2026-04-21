#!/usr/bin/env node
/**
 * Injects canonical nav from _includes/nav.html into target HTML pages.
 * Replaces content between <!-- Navigation --> comment and closing </nav> tag.
 * Run via: node scripts/build-nav.js
 * Netlify runs this automatically via netlify.toml build command.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NAV_INCLUDE = path.join(ROOT, '_includes', 'nav.html');

const TARGET_PAGES = [
    'index.html',
    'filing-your-birt.html',
    'calculator/index.html',
    'petition/index.html',
];

const navContent = fs.readFileSync(NAV_INCLUDE, 'utf8');

// Match from <!-- Navigation --> through the closing </nav>
const NAV_PATTERN = /[ \t]*<!-- Navigation -->[\s\S]*?<\/nav>/;

let updated = 0;
let skipped = 0;

for (const page of TARGET_PAGES) {
    const filePath = path.join(ROOT, page);

    if (!fs.existsSync(filePath)) {
        console.warn(`  SKIP (not found): ${page}`);
        skipped++;
        continue;
    }

    const original = fs.readFileSync(filePath, 'utf8');

    if (!NAV_PATTERN.test(original)) {
        console.warn(`  SKIP (no nav marker): ${page}`);
        skipped++;
        continue;
    }

    const result = original.replace(NAV_PATTERN, navContent.trimEnd());

    if (result === original) {
        console.log(`  unchanged: ${page}`);
    } else {
        fs.writeFileSync(filePath, result, 'utf8');
        console.log(`  updated: ${page}`);
        updated++;
    }
}

console.log(`\nNav inject complete: ${updated} updated, ${skipped} skipped.`);
