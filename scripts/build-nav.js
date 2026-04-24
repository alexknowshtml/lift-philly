#!/usr/bin/env node
/**
 * Injects canonical nav and footer includes into target HTML pages.
 * Nav: replaces content between <!-- Navigation --> comment and closing </nav> tag.
 * Footer: replaces content between <!-- Footer --> comment and closing </footer> tag.
 * Run via: node scripts/build-nav.js
 * Netlify runs this automatically via netlify.toml build command.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NAV_INCLUDE = path.join(ROOT, '_includes', 'nav.html');
const FOOTER_INCLUDE = path.join(ROOT, '_includes', 'footer.html');

const TARGET_PAGES = [
    'index.html',
    'filing-your-birt.html',
    'calculator/index.html',
    'petition/index.html',
    'explain/index.html',
    'hearings/index.html',
];

const navContent = fs.readFileSync(NAV_INCLUDE, 'utf8');
const footerContent = fs.readFileSync(FOOTER_INCLUDE, 'utf8');

const NAV_PATTERN = /[ \t]*<!-- Navigation -->[\s\S]*?<\/nav>/;
const FOOTER_PATTERN = /[ \t]*<!-- Footer -->[\s\S]*?<\/footer>/;

let updated = 0;
let skipped = 0;

for (const page of TARGET_PAGES) {
    const filePath = path.join(ROOT, page);

    if (!fs.existsSync(filePath)) {
        console.warn(`  SKIP (not found): ${page}`);
        skipped++;
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    if (NAV_PATTERN.test(content)) {
        content = content.replace(NAV_PATTERN, navContent.trimEnd());
    } else {
        console.warn(`  SKIP nav (no marker): ${page}`);
    }

    if (FOOTER_PATTERN.test(content)) {
        content = content.replace(FOOTER_PATTERN, footerContent.trimEnd());
    } else {
        console.warn(`  SKIP footer (no marker): ${page}`);
    }

    if (content === original) {
        console.log(`  unchanged: ${page}`);
    } else {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  updated: ${page}`);
        updated++;
    }
}

console.log(`\nIncludes inject complete: ${updated} updated, ${skipped} skipped.`);
