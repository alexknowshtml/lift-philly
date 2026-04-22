# LIFT Philly — Petition CTA Optimization
**Review Council Synthesis**
**Date:** 2026-04-21
**Material reviewed:** liftphilly.org — index.html, filing-your-birt.html, calculator/index.html, petition/index.html
**Council composition:** CRO Strategist, Copywriter, UX Critic, Campaign Advocate

---

## Executive Summary

Every agent independently reached the same core finding: **the petition is the primary conversion goal but has zero in-body CTAs on any supporting page.** It exists only as a nav link. All in-page conversion actions route to the email coalition form. This is the most impactful single problem on the site and fixing it requires only a few targeted HTML changes.

---

## Consensus Findings
*(All four agents agreed on these)*

1. **The petition has no in-page CTAs on the homepage, calculator, or filing-your-birt pages.** Every agent flagged this independently. The funnel is: Homepage → Email form. Calculator → Email form. Filing BIRT → Email form. The petition is orphaned from all supporting pages.

2. **The calculator's post-result moment is the highest-value missed conversion on the site.** A user who just calculated their personal tax increase ($1,208–$3,746+) is at peak emotional motivation to sign. The current post-result CTA sends them to the email coalition form.

3. **The petition page's `meta robots: noindex` tag is a critical visibility issue.** All agents noted it either directly or by implication. A civic advocacy petition that can't be found via search is severely limited in organic reach.

4. **The submit button on the petition form should be gold, not navy.** The entire site uses gold as the primary action color. The petition submit button breaks this convention.

5. **The success state after signing should offer coalition email signup as a second action.** The user just demonstrated maximum engagement — the coalition email is the natural follow-on.

---

## Contested Areas
*(Where agents differed in emphasis or recommendation)*

**Hero email form placement:**
- CRO Strategist and UX Critic both noted the hero email form may intercept petition-motivated visitors before they've been fully convinced.
- Copywriter did not criticize the form placement and focused instead on copy quality.
- Recommendation: Don't remove the hero form, but add a secondary text link beneath it pointing to the petition ("Already ready to act? Sign the petition →").

**Petition text length:**
- UX Critic flagged that the long petition text creates friction before reaching the form, and suggested a sticky "Sign Now" button or mid-page anchor.
- Campaign Advocate did not flag text length as a hesitation point and actually praised the petition text quality.
- Recommendation: Add a second anchor link to the form after the "Our Ask" box (the natural commitment point), rather than truncating the text.

**Hero headline on homepage:**
- Copywriter rated it CAUTION and suggested more provocative alternatives ("75,000 Philly workers are about to pay more taxes than Comcast").
- Other agents did not flag the headline as a priority issue.
- Recommendation: Lower-priority polish item; don't change before fixing the structural CTA issues.

---

## Blind Spots
*(Issues raised by only one agent)*

- **CRO Strategist only:** The `btn-gold` CSS class already exists on `filing-your-birt.html` but isn't used on the homepage or calculator. No new CSS needed for gold petition buttons — just use the existing class.

- **Campaign Advocate only:** The count discrepancy — homepage says 75K affected businesses, petition page says 75K. This creates doubt and suggests the two pages were written separately. One number should be standardized across all pages.

- **Campaign Advocate only:** The site's time-sensitive language says "2026" as a future event, but it's currently April 2026 (the filing deadline). Copy needs to be updated to reflect that the tax is happening *now*, not "starting in 2026."

- **Campaign Advocate only:** The anonymous checkbox is buried at the bottom of the petition form. Workers in contractor/client relationships may be deterred from signing because they don't see the anonymous option until they've read the whole form. Surface it earlier.

- **UX Critic only:** The active-state nav script runs twice (duplicate `<script>` blocks) on every page. Minor technical debt.

- **UX Critic only:** The calculator's "last-updated" label links to `/calculator/test-results/` which appears to be a dev/test URL exposed in production.

- **Copywriter only:** "Once reviewed" in the petition success state implies rejection risk. Change to "once approved, usually within 24 hours" or "shortly."

---

## Risk Summary

| Area | Severity | Raised By | Detail |
|---|---|---|---|
| No petition CTA in page body (homepage, calculator, filing-birt) | CRITICAL | All 4 agents | Primary goal has zero in-body pathways |
| Petition page `noindex` | CRITICAL | CRO Strategist, UX Critic, Campaign Advocate | Blocks all organic search discovery |
| Calculator post-result sends to email, not petition | CRITICAL | CRO Strategist, UX Critic | Highest-intent moment is unconverted |
| Submit button is navy, not gold | CAUTION | CRO Strategist, Copywriter | Breaks site-wide CTA color convention |
| 75K vs 75K number discrepancy | CAUTION | Campaign Advocate | Creates trust doubt across pages |
| Time-sensitive copy not updated for April 2026 | CAUTION | Campaign Advocate | "2026" framed as future when we're in it |
| No petition CTA in footer | CAUTION | CRO Strategist, UX Critic | Footer is a dead end on all pages |
| Anonymous option buried in form | CAUTION | Campaign Advocate | Deters contractor/freelancer signers |
| Filing-BIRT CTA is email join, not petition | CAUTION | CRO Strategist, Copywriter, UX Critic | High-intent page misroutes action |
| Post-sign success state offers no coalition email | NOTE | CRO Strategist, Copywriter | Second conversion opportunity missed |
| No signer count / social proof above petition form | NOTE | CRO Strategist, UX Critic | Social proof visible only after form |
| No urgency mechanism on petition (progress bar, deadline) | NOTE | CRO Strategist | Civic petitions convert better with targets |
| "once reviewed" language in success state implies rejection | NOTE | Copywriter | Soften to reduce post-sign anxiety |
| Hero copy too organizational ("Protecting Philly's economic wellbeing") | NOTE | Copywriter | Passive; could be more identity/urgency-led |
| Filing-BIRT has no link to calculator | NOTE | UX Critic | Natural next step is not surfaced |
| Dev URL exposed in calculator (`/test-results/`) | NOTE | UX Critic | May confuse users |
| Duplicate nav active-state script | NOTE | UX Critic | Minor technical debt |

---

## Prioritized Recommendations

### HIGH IMPACT / EASY
*(Single HTML changes, existing CSS, no new design work)*

**1. Add "Sign the Petition" button to the homepage Resources section**
- **Page:** `index.html`
- **Element:** The `<div class="btn-group">` inside `.resources` section
- **Change:** Add as the FIRST button: `<a href="/petition" class="btn btn-primary" style="background:var(--gold);color:var(--navy);">Sign the Petition →</a>`
- **Why:** Resources section is where action-ready visitors look. Currently offers Calculator, One-Pager, Testify, Share — but not the primary goal.
- **Implementation:** One line of HTML.

**2. Add petition text link below the hero email form**
- **Page:** `index.html`
- **Element:** Inside `.hero-signup` div, below the Kit script tag
- **Change:** Add: `<p style="text-align:center;margin-top:16px;"><a href="/petition" style="color:var(--gold);font-weight:600;text-decoration:underline;">Already ready? Sign the petition →</a></p>`
- **Why:** Captures petition-motivated visitors without disrupting email signup flow.
- **Implementation:** One line of HTML.

**3. Change petition page submit button from navy to gold**
- **Page:** `petition/index.html`
- **Element:** `.btn-sign` CSS rule
- **Change:** `background: var(--gold); color: var(--navy);` (and hover: `background: var(--gold-dark)`)
- **Why:** Gold is the established action/CTA color site-wide. Navy submit button is inconsistent and lower-contrast on the light form background.
- **Implementation:** Two CSS property changes.

**4. Replace the Filing-Your-BIRT bottom CTA from "Join Coalition" to "Sign the Petition" as primary**
- **Page:** `filing-your-birt.html`
- **Element:** `.cta-section` at bottom of page
- **Change:** Change the single `<a href="/#join" class="btn btn-gold">Join the Coalition →</a>` to two buttons:
  ```html
  <a href="/petition" class="btn btn-gold">Sign the Petition →</a>
  <a href="/#join" class="btn" style="background:transparent;border:2px solid var(--gold);color:var(--gold);padding:14px 28px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:12px;display:inline-block;">Join the Coalition</a>
  ```
- **Why:** Users who just read official BIRT guidance are at maximum anxiety and motivation. They need the petition, not an email form.
- **Implementation:** ~5 lines of HTML.

**5. Remove `meta robots: noindex` from petition page (or confirm it's intentional)**
- **Page:** `petition/index.html`
- **Element:** `<meta name="robots" content="noindex">` on line 9
- **Change:** Delete the line, or change to `<meta name="robots" content="index,follow">`
- **Why:** The petition page cannot be discovered via organic search. Anyone searching "Philadelphia BIRT tax petition" or "LIFT Philly sign" will not find it.
- **Implementation:** Delete one HTML tag.

**6. Add petition CTA to the calculator post-result section**
- **Page:** `calculator/index.html`
- **Element:** Inside `.estimated-quote` div, below the "Join the Coalition" button
- **Change:** Add before or replace the existing "Join the Coalition" anchor:
  ```html
  <a href="/petition" class="quote-btn" style="background:var(--gold);color:var(--navy);margin-bottom:12px;display:inline-block;">Sign the Petition to Fix This →</a>
  <a href="/#join" class="quote-btn" style="background:rgba(255,255,255,0.15);color:var(--white);">Join the Coalition</a>
  ```
- **Why:** Post-calculation is the site's highest-intent moment. The user has personalized the financial impact and is emotionally primed.
- **Implementation:** ~4 lines of HTML.

**7. Add "Sign the Petition" to footer on all pages**
- **Pages:** All four (index.html, filing-your-birt.html, calculator/index.html, petition/index.html)
- **Element:** `<footer>` section
- **Change:** Add below the footer brand:
  ```html
  <div style="margin:16px 0;display:flex;gap:24px;justify-content:center;flex-wrap:wrap;">
    <a href="/petition" style="color:var(--gold);font-weight:600;text-decoration:none;">Sign the Petition</a>
    <a href="/#join" style="color:rgba(255,255,255,0.7);text-decoration:none;">Join Coalition</a>
  </div>
  ```
- **Why:** Every page currently dead-ends at the footer. Footer CTAs are low friction and catch visitors who reach the bottom.
- **Implementation:** 6 lines, 4 pages.

---

### HIGH IMPACT / HARDER
*(Require more markup, some copy, or JS changes)*

**8. Add signer count / social proof strip above the petition form**
- **Page:** `petition/index.html`
- **Element:** Above `<div id="sign-section" class="sign-section">`
- **Change:** Insert a social proof element that pulls from the same `/api/petition/stats` call (already on the page) and renders above the form:
  ```html
  <div id="above-form-stats" style="text-align:center;margin:24px 0 0;padding:12px;background:#f1f5f9;border-radius:8px;font-size:0.95rem;color:var(--navy);font-weight:600;"></div>
  ```
  Then in the `loadStats()` JS function, also populate `above-form-stats` with the same count text.
- **Why:** Social proof before the form increases signing rates significantly. Currently the count is only visible below the form.

**9. Add petition CTA to the calculator bottom CTA section as the primary button**
- **Page:** `calculator/index.html`
- **Element:** `.cta-section` `.btn-group` div
- **Change:** Reorder buttons: add "Sign the Petition →" as the first/primary button (navy or gold), move "Join the Coalition" to secondary, keep "Sign Up to Testify" as tertiary.
  ```html
  <a href="/petition" class="btn btn-primary" style="background:var(--gold);color:var(--navy);">Sign the Petition →</a>
  <a href="/#join" class="btn btn-primary">Join the Coalition</a>
  <a href="https://tally.so/r/kd9g8e" class="btn btn-outline" target="_blank">Sign Up to Testify</a>
  ```
- **Why:** The bottom CTA section is the second conversion opportunity on the calculator. Currently no petition option exists here.

**10. Add coalition email prompt to the petition success state**
- **Page:** `petition/index.html`
- **Element:** `#sign-success` div, after the share buttons
- **Change:** Add a section below the share buttons:
  ```html
  <div style="margin-top:24px;padding-top:20px;border-top:1px solid #bbf7d0;">
    <p style="font-weight:600;color:#15803d;margin-bottom:12px;">Want updates when the hearing is scheduled?</p>
    <a href="/#join" style="display:inline-block;background:var(--navy);color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem;">Join the Coalition Email List →</a>
  </div>
  ```
- **Why:** Post-sign users are maximally engaged. They just converted on the primary goal — capturing them for the secondary goal (email) is natural and non-intrusive here.

**11. Add campaign status element to homepage**
- **Page:** `index.html`
- **Element:** Inside `.solution` section, below the timeline, or as a sticky banner at top of page
- **Change:** A hardcoded (or JS-updateable) status strip:
  ```html
  <div style="text-align:center;margin-top:32px;padding:16px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);border-radius:12px;">
    <p style="color:var(--gold);font-weight:700;font-size:1rem;">Campaign Status: Finance Committee hearing not yet scheduled — your signature matters now.</p>
    <a href="/petition" style="display:inline-block;margin-top:12px;background:var(--gold);color:var(--navy);padding:10px 24px;border-radius:8px;font-weight:700;text-decoration:none;">Sign the Petition</a>
  </div>
  ```
- **Why:** Visitors in April 2026 cannot tell if this campaign is still active. Real-time status = real-time relevance.

**12. Standardize affected-person count across site**
- **Pages:** All pages (homepage uses 75K, petition uses 75K)
- **Change:** Decide on one number. Likely 75K refers to sole proprietors specifically, and 75K includes all individual businesses. Either use one throughout, or add a brief parenthetical on first use of the larger number: "75,000 individual businesses (including ~75,000 sole proprietors)"
- **Why:** Inconsistent numbers create trust doubt. A person reading both pages notices the discrepancy.

**13. Surface anonymous option earlier in petition form**
- **Page:** `petition/index.html`
- **Element:** `.form-group` for name field
- **Change:** Add a small note below the name label: `<span style="font-size:0.78rem;color:var(--text-light);margin-top:2px;display:block;">Prefer anonymity? <a href="#anonymous-option" style="color:var(--gold-dark);">Sign anonymously</a> below.</span>` and add `id="anonymous-option"` to the anonymous checkbox wrapper.
- **Why:** Contractors, freelancers with active client relationships may hesitate to sign with their real name. Surfacing the option earlier reduces this friction.

**14. Update time-sensitive language throughout**
- **Pages:** index.html, calculator/index.html
- **Change:** 
  - Replace "facing a massive tax increase in 2026 and beyond" with "facing a tax increase that started in 2026" or "that hit this April"
  - Replace "Starting in 2026" with "Starting with the April 2026 filing deadline"
  - Add campaign relevance context: "The April 15 deadline has passed. The next chance to fix this is a City Council vote."
- **Why:** As of April 2026, the tax is no longer a future threat — it's happening. Visitors who arrive now need to feel the immediacy.

---

### POLISH / NICE TO HAVE
*(Lower conversion impact; improve quality and trust)*

**15. Add a "what happens with my signature" sentence near the petition form**
- **Page:** `petition/index.html`
- **Element:** Below the `.sign-sub` paragraph
- **Change:** Add: `<p style="font-size:0.88rem;color:var(--text-light);margin-bottom:20px;">Your signature will be included in our submission to City Council as we formally request a hearing on Bill No. 251026. We'll email you when the hearing is scheduled.</p>`

**16. Change "once reviewed" to "once approved" in success state**
- **Page:** `petition/index.html`  
- **Element:** `#sign-success` paragraph: "Your signature has been received. It will appear below once reviewed."
- **Change:** "Your signature has been received. It will appear below once approved — usually within 24 hours."

**17. Add data privacy line to petition form**
- **Page:** `petition/index.html`
- **Element:** Below the submit button
- **Change:** `<p style="font-size:0.75rem;color:var(--text-light);text-align:center;margin-top:8px;">We only use your info to count signatures and keep you informed. We never sell or share your data.</p>`

**18. Style "Sign the Petition" nav item as a button on desktop**
- **Pages:** All pages (shared nav)
- **Element:** `<a href="/petition" style="color:var(--gold);font-weight:700;">Sign the Petition</a>`
- **Change:** Add a background to make it a proper button: `style="color:var(--navy);background:var(--gold);padding:8px 16px;border-radius:8px;font-weight:700;white-space:nowrap;"`
- **Why:** Differentiates it from other nav links and reinforces it as the primary CTA.

**19. Add a mid-petition anchor link to the form**
- **Page:** `petition/index.html`
- **Element:** Below the "Our Ask" box (the natural commitment point in the petition text)
- **Change:** Add a link: `<div style="text-align:center;margin:24px 0;"><a href="#sign-section" class="btn-sign-hero">Add My Name →</a></div>`
- **Why:** Reduces scroll distance for engaged readers who reach the commitment point and are ready to sign.

**20. Add cross-link from Filing Your BIRT to Calculator**
- **Page:** `filing-your-birt.html`
- **Element:** After the Mandatory Filing Requirement section
- **Change:** Add: `<p>Want to see exactly how much your business owes? <a href="/calculator">Calculate your specific BIRT impact →</a></p>`
- **Why:** Natural next step for a confused filer reading official guidance.

**21. Remove or fix dev URL in calculator**
- **Page:** `calculator/index.html`
- **Element:** `<a href="/calculator/test-results/" class="last-updated">Last updated: Jan 17, 2026 at 10:44 AM</a>`
- **Change:** Either remove the link (keep the text as static), or verify `/calculator/test-results/` is a valid public URL.

**22. Add a second signing-type explanation for "Concerned Citizen"**
- **Page:** `petition/index.html`
- **Element:** `.signer-type-btn` for `concerned_citizen`
- **Current sub-text:** "Standing with my community"
- **Change:** Consider "I'm a customer, neighbor, or employer of someone affected" — slightly more specific so signers self-identify more confidently.

---

## Overall Assessment

The LIFT Philly site is well-designed, credibly sourced, and emotionally resonant — especially the petition page itself, which is genuinely excellent campaign content. The problem is structural: the petition is isolated from the rest of the site's conversion architecture. Every supporting page routes visitors to the email coalition form rather than the petition, despite the petition being the stated primary goal.

Fixing items 1–7 (all high-impact/easy) takes roughly 30–45 minutes of development work and would dramatically increase petition traffic. Items 1–3 alone (homepage Resources button, hero text link, gold submit button) could be deployed in under 10 minutes and would immediately close the most critical funnel gaps.

The `noindex` tag on the petition page (item 5) is arguably the single highest-leverage change: if the petition is ready for public traffic, removing that one tag opens the page to all organic search discovery.

---

## Full Council Agent Outputs

Individual agent reviews are in:
- `/home/alexhillman/lift-philly/.claude/plans/council-lift-philly-cro-2026-04-21/agent-outputs/cro-strategist.md`
- `/home/alexhillman/lift-philly/.claude/plans/council-lift-philly-cro-2026-04-21/agent-outputs/copywriter.md`
- `/home/alexhillman/lift-philly/.claude/plans/council-lift-philly-cro-2026-04-21/agent-outputs/ux-critic.md`
- `/home/alexhillman/lift-philly/.claude/plans/council-lift-philly-cro-2026-04-21/agent-outputs/campaign-advocate.md`
