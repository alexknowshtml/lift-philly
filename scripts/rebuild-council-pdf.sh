#!/usr/bin/env bash
# rebuild-council-pdf.sh
# Full pipeline: Turso → HTML cards → PDF → DO Spaces + cache purge
# Usage: bash scripts/rebuild-council-pdf.sh

set -e

LIFT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HTML_FILE="$LIFT_DIR/petition-comments-council.html"
PDF_FILE="$LIFT_DIR/petition-comments-council.pdf"
BUCKET="indyhall"
DO_ENDPOINT="https://nyc3.digitaloceanspaces.com"
FILENAME="lift-philly-petition-comments-council.pdf"
CDN_ID="4be1bab8-ed7d-4f26-ac87-7901eed6b34b"
CF_ZONE="8d2c9ee93fd716bfd5594bbf7b665cb7"
PUBLIC_URL="https://page.jfdi.bot/public/${FILENAME}"

# IDs excluded for off-message content (spam, profanity, defund tangents, factual errors)
EXCLUDED_IDS="124,249,309,374,446,473,514,573,577,608,611,682,684"

echo "=== LIFT Philly Council PDF Rebuild ==="
echo ""

# ── Step 1: Credentials ──────────────────────────────────────────────────────

echo "[1/7] Fetching credentials..."

TURSO_URL=$(bun /home/alexhillman/andy/scripts/get-credential.ts lift-philly-turso-url 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('api_key') or d.get('token') or d.get('value') or list(d.values())[0])")
TURSO_TOKEN=$(bun /home/alexhillman/andy/scripts/get-credential.ts lift-philly-turso-token 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('api_key') or d.get('token') or d.get('value') or list(d.values())[0])")
HTTP_URL="${TURSO_URL/libsql:\/\//https://}"

SPACES_CREDS=$(curl -s http://localhost:2641/proxy/v1/credentials/do-spaces)
AWS_ACCESS_KEY_ID=$(echo "$SPACES_CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_key_id'])")
AWS_SECRET_ACCESS_KEY=$(echo "$SPACES_CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['secret_access_key'])")

DO_TOKEN=$(curl -s http://localhost:2641/proxy/v1/credentials/do-api | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['api_key'])")
CF_TOKEN=$(curl -s http://localhost:2641/proxy/v1/credentials/cloudflare | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['api_key'])")

echo "    OK"

# ── Step 2: Pull from Turso ──────────────────────────────────────────────────

echo "[2/7] Querying petition_signers from Turso..."

TURSO_RESPONSE=$(curl -s -X POST "$HTTP_URL/v2/pipeline" \
  -H "Authorization: Bearer $TURSO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "type": "execute",
        "stmt": {
          "sql": "SELECT id, name, industry, zip_code, comment FROM petition_signers WHERE comment IS NOT NULL AND comment != '\'''\'' AND status = '\''approved'\'' ORDER BY created_at ASC;"
        }
      },
      {"type": "close"}
    ]
  }')

ROW_COUNT=$(echo "$TURSO_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
rows = d['results'][0]['response']['result']['rows']
print(len(rows))
")
echo "    $ROW_COUNT rows fetched"

# ── Step 3: Build HTML cards ─────────────────────────────────────────────────

echo "[3/7] Building comment cards (excluding IDs: $EXCLUDED_IDS)..."

CARDS_HTML=$(echo "$TURSO_RESPONSE" | python3 -c "
import sys, json, html

EXCLUDED = {$EXCLUDED_IDS}

def cell(row, idx):
    v = row[idx]
    if isinstance(v, dict):
        return v.get('value') or ''
    return v or ''

data = json.load(sys.stdin)
rows = data['results'][0]['response']['result']['rows']

cards = []
skipped = 0
for row in rows:
    rid = int(cell(row, 0) or 0)
    if rid in EXCLUDED:
        skipped += 1
        continue

    name_raw = cell(row, 1).strip()
    industry = cell(row, 2).strip()
    zipcode  = cell(row, 3).strip()
    comment  = cell(row, 4).strip()

    if not comment:
        skipped += 1
        continue

    # First name + last initial
    parts = name_raw.split()
    if len(parts) >= 2:
        display_name = parts[0] + ' ' + parts[-1][0] + '.'
    else:
        display_name = parts[0] if parts else 'Anonymous'

    # Attribution: Name · Industry · Zip (omit blanks)
    attr_parts = [display_name]
    if industry:
        attr_parts.append(html.escape(industry))
    if zipcode:
        attr_parts.append(zipcode)
    attribution = ' &nbsp;&bull;&nbsp; '.join(attr_parts)

    cards.append(
        '<div class=\"comment-card\">\n'
        '            <div class=\"comment-text\">' + html.escape(comment) + '</div>\n'
        '            <div class=\"comment-attribution\">&mdash; ' + attribution + '</div>\n'
        '        </div>'
    )

print('\n        '.join(cards), file=sys.stderr)
print(len(cards), skipped)
" 2>/tmp/lp_cards.html)

CARD_COUNT=$(echo "$CARDS_HTML" | awk '{print $1}')
SKIP_COUNT=$(echo "$CARDS_HTML" | awk '{print $2}')
echo "    $CARD_COUNT cards built, $SKIP_COUNT excluded/blank"

# ── Step 4: Inject cards into HTML ──────────────────────────────────────────

echo "[4/7] Injecting cards into HTML..."

# Keep header (lines 1–328), append cards + close
head -n 328 "$HTML_FILE" > /tmp/lp_council_new.html
echo "" >> /tmp/lp_council_new.html
cat /tmp/lp_cards.html >> /tmp/lp_council_new.html
printf "\n\n</body>\n</html>\n" >> /tmp/lp_council_new.html
cp /tmp/lp_council_new.html "$HTML_FILE"

FINAL_LINE=$(wc -l < "$HTML_FILE")
echo "    HTML updated ($FINAL_LINE lines)"

# ── Step 5: Generate PDF via Playwright ─────────────────────────────────────

echo "[5/7] Generating PDF via Playwright..."

cat > /tmp/lp_gen_pdf.js << 'JSEOF'
const { chromium } = require('playwright');
const path = require('path');

const HTML_FILE = process.argv[2];
const PDF_FILE  = process.argv[3];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(HTML_FILE), { waitUntil: 'networkidle' });
  await page.pdf({
    path: PDF_FILE,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await browser.close();
  console.log('PDF generated:', PDF_FILE);
})().catch(e => { console.error(e); process.exit(1); });
JSEOF

node /tmp/lp_gen_pdf.js "$HTML_FILE" "$PDF_FILE"
PDF_SIZE=$(du -sh "$PDF_FILE" | cut -f1)
echo "    $PDF_FILE ($PDF_SIZE)"

# ── Step 6: Upload to DO Spaces ─────────────────────────────────────────────

echo "[6/7] Uploading to DO Spaces (indyhall/public/)..."

AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  aws s3 cp "$PDF_FILE" "s3://$BUCKET/public/$FILENAME" \
  --acl public-read \
  --content-type "application/pdf" \
  --endpoint-url="$DO_ENDPOINT" \
  --quiet

echo "    Uploaded → $PUBLIC_URL"

# ── Step 7: Purge caches ─────────────────────────────────────────────────────

echo "[7/7] Purging caches..."

# DO CDN
DO_PURGE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  "https://api.digitalocean.com/v2/cdn/endpoints/${CDN_ID}/cache" \
  -H "Authorization: Bearer $DO_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"files\":[\"public/${FILENAME}\"]}")
echo "    DO CDN: $DO_PURGE (204 = OK)"

# Cloudflare
CF_PURGE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/purge_cache" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"files\":[\"${PUBLIC_URL}\"]}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else d)")
echo "    Cloudflare: $CF_PURGE"

echo ""
echo "=== Done ==="
echo "    $CARD_COUNT comments  |  PDF: $PDF_SIZE"
echo "    $PUBLIC_URL"
