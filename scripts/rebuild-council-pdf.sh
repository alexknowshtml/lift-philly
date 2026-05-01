#!/usr/bin/env bash
# rebuild-council-pdf.sh
# Full pipeline: Turso → HTML cards → PDF → DO Spaces (test) or git push (publish)
# Usage: bash scripts/rebuild-council-pdf.sh           # test mode (DO Spaces)
#        bash scripts/rebuild-council-pdf.sh --publish  # publish to liftphilly.org

set -e

PUBLISH=false
[[ "$1" == "--publish" ]] && PUBLISH=true

LIFT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HTML_FILE="$LIFT_DIR/petition-comments-council.html"
SOURCE_FILE="$LIFT_DIR/petition-comments-council-source.html"
PDF_FILE="$LIFT_DIR/petition-comments-council.pdf"
BUCKET="indyhall"
DO_ENDPOINT="https://nyc3.digitaloceanspaces.com"
FILENAME="lift-philly-council-preview.pdf"
CDN_ID="4be1bab8-ed7d-4f26-ac87-7901eed6b34b"
CF_ZONE="8d2c9ee93fd716bfd5594bbf7b665cb7"
TEST_URL="https://page.jfdi.bot/public/${FILENAME}"
PROD_URL="https://liftphilly.org/petition-comments-council.pdf"

# IDs excluded for off-message content (spam, profanity, defund tangents, factual errors)
EXCLUDED_IDS="124,249,309,374,446,473,514,573,577,608,611,682,684"

echo "=== LIFT Philly Council PDF Rebuild ==="
echo ""

# ── Step 1: Credentials ──────────────────────────────────────────────────────

echo "[1/6] Fetching credentials..."

TURSO_URL=$(bun /home/alexhillman/andy/scripts/get-credential.ts lift-philly-turso-url 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('api_key') or d.get('token') or d.get('value') or list(d.values())[0])")
TURSO_TOKEN=$(bun /home/alexhillman/andy/scripts/get-credential.ts lift-philly-turso-token 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('api_key') or d.get('token') or d.get('value') or list(d.values())[0])")
HTTP_URL="${TURSO_URL/libsql:\/\//https://}"

if [[ "$PUBLISH" == "false" ]]; then
  SPACES_CREDS=$(curl -s http://localhost:2641/proxy/v1/credentials/do-spaces)
  AWS_ACCESS_KEY_ID=$(echo "$SPACES_CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_key_id'])")
  AWS_SECRET_ACCESS_KEY=$(echo "$SPACES_CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['secret_access_key'])")
  DO_TOKEN=$(curl -s http://localhost:2641/proxy/v1/credentials/do-api | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['api_key'])")
  CF_TOKEN=$(curl -s http://localhost:2641/proxy/v1/credentials/cloudflare | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['api_key'])")
fi

echo "    OK (mode: $( [[ "$PUBLISH" == "true" ]] && echo publish || echo test ))"

# ── Step 2: Pull from Turso ──────────────────────────────────────────────────

echo "[2/6] Querying petition_signers from Turso..."

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

echo "[3/6] Building comment cards (excluding IDs: $EXCLUDED_IDS)..."

CARDS_HTML=$(echo "$TURSO_RESPONSE" | python3 -c "
import sys, json, html

EXCLUDED = {$EXCLUDED_IDS}
PINNED = [375, 373, 443, 241, 220, 324, 388, 442, 266, 214]

def cell(row, idx):
    v = row[idx]
    if isinstance(v, dict):
        return v.get('value') or ''
    return v or ''

def make_card(rid, name_raw, industry, zipcode, comment):
    parts = name_raw.split()
    if len(parts) >= 2:
        display_name = parts[0] + ' ' + parts[-1][0] + '.'
    else:
        display_name = parts[0] if parts else 'Anonymous'
    attr_parts = [display_name]
    if industry:
        attr_parts.append(html.escape(industry))
    if zipcode:
        attr_parts.append(zipcode)
    attribution = ' &nbsp;&bull;&nbsp; '.join(attr_parts)
    return (
        '<div class=\"comment-card\">\n'
        '            <div class=\"comment-text\">' + html.escape(comment) + '</div>\n'
        '            <div class=\"comment-attribution\">&mdash; ' + attribution + '</div>\n'
        '        </div>'
    )

data = json.load(sys.stdin)
rows = data['results'][0]['response']['result']['rows']

by_id = {}
ordered = []
skipped = 0
for row in rows:
    rid = int(cell(row, 0) or 0)
    if rid in EXCLUDED:
        skipped += 1
        continue
    comment = cell(row, 4).strip()
    if not comment:
        skipped += 1
        continue
    by_id[rid] = row
    ordered.append(rid)

cards = []
# Pinned first (in specified order)
for rid in PINNED:
    if rid in by_id:
        row = by_id[rid]
        cards.append(make_card(rid, cell(row,1).strip(), cell(row,2).strip(), cell(row,3).strip(), cell(row,4).strip()))

# Rest in original order, skipping pinned
pinned_set = set(PINNED)
for rid in ordered:
    if rid not in pinned_set:
        row = by_id[rid]
        cards.append(make_card(rid, cell(row,1).strip(), cell(row,2).strip(), cell(row,3).strip(), cell(row,4).strip()))

print('\n        '.join(cards), file=sys.stderr)
print(len(cards), skipped)
" 2>/tmp/lp_cards.html)

CARD_COUNT=$(echo "$CARDS_HTML" | awk '{print $1}')
SKIP_COUNT=$(echo "$CARDS_HTML" | awk '{print $2}')
echo "    $CARD_COUNT cards built, $SKIP_COUNT excluded/blank"

# ── Step 4: Inject cards into HTML ──────────────────────────────────────────

echo "[4/6] Injecting cards into HTML..."

# Generate QR code as base64
QR_B64=$(python3 -c "
import qrcode, base64
from io import BytesIO
qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=4, border=2)
qr.add_data('https://liftphilly.org/petition')
qr.make(fit=True)
img = qr.make_image(fill_color='#0f172a', back_color='white')
buf = BytesIO()
img.save(buf, format='PNG')
print(base64.b64encode(buf.getvalue()).decode())
")

# Write QR to temp file
echo "$QR_B64" > /tmp/lp_qr.b64

# Write footer generator script
cat > /tmp/lp_gen_footer.py << 'PYEOF'
with open('/tmp/lp_qr.b64') as f:
    qr_b64 = f.read().strip()

print(f"""        <style>
            /* anchor cover page so footer can be absolutely positioned */
            .cover-page {{
                position: relative;
                height: 10in;
                min-height: unset;
            }}
            /* yellow bar sits outside/below the header, flush against it */
            .cover-body {{
                padding-top: 16px;
                padding-bottom: 0;
            }}
            @media print {{
                .header-cover {{
                    margin: -0.5in 0 0 -0.5in;
                    width: calc(100% + 1in);
                    padding-top: calc(0.5in + 20px);
                    padding-left: calc(0.5in + 24px);
                    border-bottom: 4px solid #fbbf24;
                }}
            }}
            .gold-divider {{
                display: none;
            }}
            /* bigger body text, tighter paragraph spacing */
            .cover-statement {{
                font-size: 10.5pt;
                line-height: 1.5;
                padding-bottom: 24px;
            }}
            .cover-statement p {{
                margin-bottom: 5px;
            }}
            .cover-footer-box {{
                position: relative;
                margin-top: auto;
                margin-left: -0.5in;
                width: calc(100% + 1in);
                background: #0f172a;
                padding: 26px 24px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
            }}
            .cover-footer-box::before {{
                content: '';
                position: absolute;
                top: -5px;
                left: 0;
                right: 0;
                height: 5px;
                background: #fbbf24;
            }}
            .footer-qr-inner {{
                background: white;
                padding: 10px;
                border-radius: 4px;
                text-align: center;
                display: inline-block;
            }}
            .footer-qr-label {{
                font-size: 7pt;
                color: #0f172a;
                margin-top: 4px;
                font-weight: 600;
                font-family: 'Inter', sans-serif;
            }}
        </style>
        <div class="cover-footer-box">
            <div class="footer-qr-inner">
                <img src="data:image/png;base64,{qr_b64}" width="64" height="64" alt="QR to liftphilly.org/petition">
                <div class="footer-qr-label">liftphilly.org/petition</div>
            </div>
        </div>""")
PYEOF

# Generate footer HTML → temp file
python3 /tmp/lp_gen_footer.py > /tmp/lp_footer.html

# Assemble final HTML: source template → close cover-statement → footer → close cover-body/page → running header + cards
cat "$SOURCE_FILE" > /tmp/lp_council_new.html
printf "\n        </div>\n" >> /tmp/lp_council_new.html
cat /tmp/lp_footer.html >> /tmp/lp_council_new.html
printf "\n    </div>\n</div>\n\n" >> /tmp/lp_council_new.html
printf '<div class="header-running">\n    <div class="logo-small">LIFT <span>Philly</span></div>\n    <div class="running-right">Constituent Testimonies &mdash; Bill 251026</div>\n</div>\n\n' >> /tmp/lp_council_new.html
cat /tmp/lp_cards.html >> /tmp/lp_council_new.html
printf "\n\n</body>\n</html>\n" >> /tmp/lp_council_new.html
cp /tmp/lp_council_new.html "$HTML_FILE"

FINAL_LINE=$(wc -l < "$HTML_FILE")
echo "    HTML updated ($FINAL_LINE lines)"

# ── Step 5: Generate PDF via Playwright ─────────────────────────────────────

echo "[5/6] Generating PDF via Playwright..."

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
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
  });
  await browser.close();
  console.log('PDF generated:', PDF_FILE);
})().catch(e => { console.error(e); process.exit(1); });
JSEOF

NODE_PATH=/home/alexhillman/lift-philly/node_modules node /tmp/lp_gen_pdf.js "$HTML_FILE" "$PDF_FILE"
PDF_SIZE=$(du -sh "$PDF_FILE" | cut -f1)
echo "    $PDF_FILE ($PDF_SIZE)"

# ── Step 6: Publish ──────────────────────────────────────────────────────────

if [[ "$PUBLISH" == "true" ]]; then
  echo "[6/6] Publishing to liftphilly.org (git push → Netlify)..."
  cd "$LIFT_DIR"
  git add petition-comments-council.pdf petition-comments-council.html
  git diff --cached --quiet || git commit -m "Rebuild council PDF ($(TZ='America/New_York' date '+%Y-%m-%d %H:%M ET')): $CARD_COUNT comments"
  git push origin main
  echo "    Pushed → $PROD_URL"
  PUBLIC_URL="$PROD_URL"
else
  echo "[6/6] Uploading to DO Spaces (test mode)..."
  AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
    aws s3 cp "$PDF_FILE" "s3://$BUCKET/public/$FILENAME" \
    --acl public-read \
    --content-type "application/pdf" \
    --endpoint-url="$DO_ENDPOINT" \
    --quiet
  DO_PURGE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    "https://api.digitalocean.com/v2/cdn/endpoints/${CDN_ID}/cache" \
    -H "Authorization: Bearer $DO_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"files\":[\"public/${FILENAME}\"]}")
  CF_PURGE=$(curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/purge_cache" \
    -H "Authorization: Bearer ${CF_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"files\":[\"${TEST_URL}\"]}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else d)")
  echo "    DO CDN: $DO_PURGE | CF: $CF_PURGE"
  echo "    Test URL: $TEST_URL"
  PUBLIC_URL="$TEST_URL"
fi

echo ""
echo "=== Done ==="
echo "    $CARD_COUNT comments  |  PDF: $PDF_SIZE"
echo "    $PUBLIC_URL"
