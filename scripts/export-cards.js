#!/usr/bin/env node
// Export all LIFT Philly card variations as PNGs
// Usage: node scripts/export-cards.js [TEMPLATES=A,B,C] [OUT_DIR=./card-exports]

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

const ROOT = path.join(__dirname, '..');
const PORT = 14321;
const TEMPLATES = (process.env.TEMPLATES || 'A,B,C').split(',');
const OUT_DIR = path.resolve(process.env.OUT_DIR || path.join(ROOT, 'card-exports'));

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const pathname = url.parse(req.url).pathname;
      const filePath = path.join(ROOT, pathname === '/' ? 'card-generator.html' : pathname);
      fs.readFile(filePath, (err, content) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      });
    });
    server.on('error', reject);
    server.listen(PORT, () => {
      console.log(`Serving http://localhost:${PORT}/`);
      resolve(server);
    });
  });
}

async function main() {
  for (const tpl of TEMPLATES) {
    fs.mkdirSync(path.join(OUT_DIR, tpl), { recursive: true });
  }

  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  page.on('console', m => { if (m.type() === 'error') console.error('[page error]', m.text()); });

  console.log('Loading page...');
  await page.goto(`http://localhost:${PORT}/card-generator.html`, { waitUntil: 'networkidle' });

  // Wait for counter to show real data (starts as "— / 508" then becomes "1 / 508")
  await page.waitForFunction(
    () => {
      const el = document.getElementById('testi-counter');
      return el && !el.textContent.startsWith('—') && el.textContent.includes('/');
    },
    { timeout: 30000 }
  );

  await page.evaluate(() => document.fonts.ready);

  const counterText = await page.locator('#testi-counter').textContent();
  const count = parseInt(counterText.split('/')[1].trim(), 10);
  const total = count * TEMPLATES.length;
  console.log(`${count} testimonials × ${TEMPLATES.length} templates = ${total} cards\n`);

  let exported = 0;

  for (const tpl of TEMPLATES) {
    // Click the template tab button
    await page.click(`button[data-tpl="${tpl}"]`);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

    console.log(`Template ${tpl}:`);

    for (let i = 0; i < count; i++) {
      // loadTestimonial is a function declaration — accessible on window
      await page.evaluate(idx => window.loadTestimonial(idx), i);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

      const dataUrl = await page.evaluate(() => document.getElementById('card').toDataURL('image/png'));
      const outFile = path.join(OUT_DIR, tpl, `card-${tpl}-${String(i + 1).padStart(4, '0')}.png`);
      fs.writeFileSync(outFile, Buffer.from(dataUrl.slice(22), 'base64'));

      exported++;
      if ((i + 1) % 50 === 0 || i + 1 === count) {
        process.stdout.write(`\r  ${i + 1}/${count}`);
      }
    }

    console.log(`\n  → saved to card-exports/${tpl}/`);
  }

  console.log(`\nDone — ${exported} cards in ${OUT_DIR}`);
  await browser.close();
  server.close();
}

main().catch(err => { console.error(err); process.exit(1); });
