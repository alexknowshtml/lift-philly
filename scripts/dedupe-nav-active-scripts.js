#!/usr/bin/env node
/**
 * One-off cleanup: remove the run of duplicate active-link <script> blocks
 * that build-nav.js accumulated under each page's </nav>, replace with a
 * single canonical block (variant 2 — skips .nav-submenu items).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
    'index.html',
    'filing-your-birt.html',
    'petition/index.html',
    'explain/index.html',
    'hearings/index.html',
    'action/index.html',
];

const CANONICAL = `    <script>
        (function() {
            var path = window.location.pathname.replace(/\\/$/, '') || '/';
            document.querySelectorAll('.nav-links a').forEach(function(link) {
                if (link.closest('.nav-submenu')) return;
                var href = link.getAttribute('href').replace(/\\/$/, '') || '/';
                if (href === path || (href !== '/' && href !== '/#join' && path.startsWith(href))) {
                    link.classList.add('active');
                }
            });
        })();
    </script>`;

// Match one or more contiguous active-link <script> blocks (variant 1 OR 2),
// separated only by whitespace.
const SINGLE_BLOCK = String.raw`[ \t]*<script>\s*\(function\(\)\s*\{\s*var path = window\.location\.pathname\.replace\([^)]*\)[\s\S]*?\}\)\(\);\s*</script>`;
const RUN = new RegExp(`(?:${SINGLE_BLOCK}\\s*)+`, 'g');

let touched = 0;
for (const page of PAGES) {
    const file = path.join(ROOT, page);
    const orig = fs.readFileSync(file, 'utf8');

    // Find runs and replace with the canonical block (only the FIRST run keeps
    // a script; subsequent runs are deleted entirely).
    let kept = false;
    const next = orig.replace(RUN, () => {
        if (!kept) { kept = true; return `\n${CANONICAL}\n`; }
        return '';
    });

    if (next !== orig) {
        fs.writeFileSync(file, next);
        touched++;
        console.log(`  ${page}: cleaned up`);
    } else {
        console.log(`  ${page}: no change`);
    }
}
console.log(`\n${touched} files updated.`);
