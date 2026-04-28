#!/usr/bin/env node
/**
 * Injects canonical nav/footer HTML and ensures nav.css + nav.js are linked.
 * - Nav HTML: replaces content between <!-- Navigation --> and </nav>
 * - Footer HTML: replaces content between <!-- Footer --> and </footer>
 * - Nav CSS: ensures <link rel="stylesheet" href="/nav.css"> is in <head>
 * - Nav JS: ensures <script src="/nav.js"></script> is before </body>;
 *           strips legacy inline nav scripts (toggleNav/closeNav/toggleResourcesMenu)
 *           and active-link IIFEs so /nav.js is the single source of truth.
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
    'action/index.html',
];

const navContent = fs.readFileSync(NAV_INCLUDE, 'utf8');
const footerContent = fs.readFileSync(FOOTER_INCLUDE, 'utf8');

const NAV_PATTERN = /[ \t]*<!-- Navigation -->[\s\S]*?<\/nav>/;
const FOOTER_PATTERN = /[ \t]*<!-- Footer -->[\s\S]*?<\/footer>/;
const NAV_CSS_LINK = '<link rel="stylesheet" href="/nav.css">';
const NAV_JS_LINK = '<script src="/nav.js"></script>';

// Match any inline <script> block whose contents reference one of the
// nav-handling identifiers we now own in /nav.js. Anchored to <script>
// (no src attr) so external script tags are left alone.
const NAV_INLINE_PATTERNS = [
    /[ \t]*<script>\s*function toggleNav\(\)[\s\S]*?<\/script>/g,
    /[ \t]*<script>\s*function toggleResourcesMenu\([\s\S]*?<\/script>/g,
    /[ \t]*<script>\s*\(function\(\)\s*\{\s*var path = window\.location\.pathname[\s\S]*?\}\)\(\);\s*<\/script>/g,
];

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

    // Inject nav HTML
    if (NAV_PATTERN.test(content)) {
        content = content.replace(NAV_PATTERN, navContent.trimEnd());
    } else {
        console.warn(`  SKIP nav (no marker): ${page}`);
    }

    // Inject footer HTML
    if (FOOTER_PATTERN.test(content)) {
        content = content.replace(FOOTER_PATTERN, footerContent.trimEnd());
    } else {
        console.warn(`  SKIP footer (no marker): ${page}`);
    }

    // Ensure nav.css is linked (add before </head> if missing)
    if (!content.includes('href="/nav.css"')) {
        content = content.replace('</head>', `    ${NAV_CSS_LINK}\n</head>`);
        console.log(`  added nav.css link: ${page}`);
    }

    // Strip legacy inline nav scripts so /nav.js is the only source.
    let strippedCount = 0;
    for (const pat of NAV_INLINE_PATTERNS) {
        content = content.replace(pat, () => { strippedCount++; return ''; });
    }
    // Collapse blank-line runs left behind by stripped scripts.
    content = content.replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n');
    if (strippedCount > 0) {
        console.log(`  stripped ${strippedCount} inline nav script block(s): ${page}`);
    }

    // Ensure nav.js is linked before </body>.
    if (!content.includes('src="/nav.js"')) {
        content = content.replace('</body>', `    ${NAV_JS_LINK}\n</body>`);
        console.log(`  added nav.js link: ${page}`);
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
