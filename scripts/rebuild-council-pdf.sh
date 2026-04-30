#!/usr/bin/env bash
# rebuild-council-pdf.sh
# Full pipeline: Turso → HTML cards → PDF → DO Spaces + cache purge
# Usage: bash scripts/rebuild-council-pdf.sh

set -e

LIFT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HTML_FILE="$LIFT_DIR/petition-comments-council.html"
SOURCE_FILE="$LIFT_DIR/petition-comments-council-source.html"
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

echo "[4/7] Injecting cards into HTML..."

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

# Fetch total signer count (including those without comments)
TOTAL_SIGNERS=$(curl -s -X POST "$HTTP_URL/v2/pipeline" \
  -H "Authorization: Bearer $TURSO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requests":[{"type":"execute","stmt":{"sql":"SELECT COUNT(*) FROM petition_signers WHERE status='\''approved'\''"}},{"type":"close"}]}' \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d['results'][0]
rows=(r.get('response') or r).get('result',{}).get('rows',[])
v=rows[0][0]
print(v['value'] if isinstance(v,dict) else v)
")
# Write turso data to file to avoid quoting issues with large JSON
echo "$TURSO_RESPONSE" > /tmp/lp_turso.json
echo "$QR_B64" > /tmp/lp_qr.b64

# Write footer generator script (reads from temp files, gets counts as args)
cat > /tmp/lp_gen_footer.py << 'PYEOF'
import sys, json, re, html as htmlmod
from collections import Counter

total_signers = sys.argv[1]
card_count_arg = sys.argv[2]

EXCLUDED = {124,249,309,374,446,473,514,573,577,608,611,682,684}

with open('/tmp/lp_turso.json') as f:
    data = json.load(f)

with open('/tmp/lp_qr.b64') as f:
    qr_b64 = f.read().strip()

rows = data['results'][0]['response']['result']['rows']

def cell(row, idx):
    v = row[idx]
    if isinstance(v, dict): return v.get('value') or ''
    return str(v) if v is not None else ''

industries = Counter()
theme_counts = Counter()

theme_keywords = {
    'Considering leaving': r'leav|relocat|move out|moving out|exit the city|will not be able to remain',
    'Long-time business owners': r'\b(5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|25|30|36|42)\s+years',
    'Family financial impact': r'family|kids|children|spouse|husband|wife|disabled|parent',
    'Financial strain': r'cannot afford|can.t afford|behind on|scraping|drained|crushing|debilitat|unsustainable|impossible to',
    'Business closures': r'close|shut down|final nail|coffin|forced.*job|cut.*back',
}

for row in rows:
    rid = int(cell(row, 0) or 0)
    if rid in EXCLUDED: continue
    comment = cell(row, 4).strip()
    ind = cell(row, 2).strip()
    if not comment: continue
    if ind: industries[ind] += 1
    cl = comment.lower()
    for theme, pat in theme_keywords.items():
        if re.search(pat, cl):
            theme_counts[theme] += 1

top_industries = [ind for ind, _ in industries.most_common(3)]
theme_pills = ''.join(
    f'<span class="theme-pill">{htmlmod.escape(t)} ({c})</span>'
    for t, c in theme_counts.most_common(5)
)
top_ind_pills = ''.join(
    f'<span class="theme-pill">{htmlmod.escape(i)}</span>'
    for i in top_industries
)

print(f"""        <div class="cover-footer">
            <div style="flex:1;">
                <div class="cover-stats">
                    <div class="stat-pill"><span class="stat-num">{total_signers}</span><span class="stat-label">petition signatures</span></div>
                    <div class="stat-pill"><span class="stat-num">{card_count_arg}</span><span class="stat-label">written testimonies</span></div>
                    <div class="stat-pill"><span class="stat-num">{theme_counts.get('Considering leaving', 0)}</span><span class="stat-label">considering leaving Philly</span></div>
                    <div class="stat-pill"><span class="stat-num">{theme_counts.get('Long-time business owners', 0)}</span><span class="stat-label">5+ year business owners</span></div>
                </div>
                <div class="cover-themes" style="margin-top:8px;">
                    <div class="theme-label">Top industries</div>
                    <div class="theme-pills">{top_ind_pills}</div>
                </div>
                <div class="cover-themes" style="margin-top:6px;">
                    <div class="theme-label">Common themes in testimonies</div>
                    <div class="theme-pills">{theme_pills}</div>
                </div>
            </div>
            <div class="cover-qr">
                <img src="data:image/png;base64,{qr_b64}" width="72" height="72" alt="QR code to petition">
                <div class="qr-label">liftphilly.org/petition</div>
            </div>
        </div>""")
PYEOF

# Generate footer HTML → temp file
python3 /tmp/lp_gen_footer.py "$TOTAL_SIGNERS" "$CARD_COUNT" > /tmp/lp_footer.html

# Assemble final HTML: source template + footer + close cover divs + running header + cards
cat "$SOURCE_FILE" > /tmp/lp_council_new.html
cat /tmp/lp_footer.html >> /tmp/lp_council_new.html
printf "\n        </div>\n    </div>\n</div>\n\n" >> /tmp/lp_council_new.html
printf '<div class="header-running">\n    <div class="logo-small">LIFT <span>Philly</span></div>\n    <div class="running-right">Constituent Testimonies &mdash; Bill 251026</div>\n</div>\n\n' >> /tmp/lp_council_new.html
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

NODE_PATH=/home/alexhillman/lift-philly/node_modules node /tmp/lp_gen_pdf.js "$HTML_FILE" "$PDF_FILE"
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
