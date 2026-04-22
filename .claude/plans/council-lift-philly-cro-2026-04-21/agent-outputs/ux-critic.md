---
role: "UX Critic"
mandate: "Review nav structure, page flow, friction points, dead ends, and whether the nav reinforces the petition as the destination"
completed_at: "2026-04-21T21:58:00-04:00"
---

# UX Critic Review — LIFT Philly

## Overall Assessment

The navigation correctly highlights the petition (gold + bold), but the page flows create dead ends and redirect motivated visitors away from it. The most critical UX issue is that the site has two distinct conversion paths (petition and coalition email) but only one of them (email) has in-page CTAs. A user who arrives via social share or organic search, reads the homepage, and follows every in-page CTA will end up on the email form — never the petition. The petition is effectively orphaned from the information architecture.

---

## Navigation

### Desktop Nav

```
LIFT Philly | Home | Filing Your BIRT | Increase Calculator | Join Coalition | Sign the Petition
```

CAUTION: "Sign the Petition" being the last item (gold + bold) is good for salience, but it appears after "Join Coalition" — which creates ambiguity about which is the primary action. The visual styling (gold) signals priority, but the position (last item) signals it's an afterthought. Conventions for navigation ordering vary, but for conversion-focused sites, the primary CTA is typically rendered as a button, not just a styled link. 

Consider replacing the "Sign the Petition" nav link with a proper gold button (border-radius, padding, background: var(--gold), color: var(--navy)) to differentiate it clearly from the other text links. This is a one-CSS-change fix.

NOTE: The nav active-state logic runs twice (two identical `<script>` blocks on each page). This is a minor bug — not UX-impacting but worth cleaning up.

### Mobile Nav

The hamburger menu collapses all links including "Sign the Petition." On mobile, a user has to tap the hamburger to discover the petition CTA. Given that civic advocacy campaigns drive significant mobile traffic from social shares, the petition CTA should be visible without opening the menu — perhaps as a persistent floating button on mobile, or sticky at the bottom of the viewport.

---

## Homepage Flow

**Page intent:** Explain the problem, establish credibility, capture email
**Actual flow as experienced:**

1. Nav (petition visible, gold)
2. Hero headline + email signup form
3. Stats
4. Driscoll quote + one-pager download
5. [scroll] Problem section — impact numbers
6. [scroll] Council quotes
7. [scroll] "A system problem, not a rate problem" explanation
8. [scroll] Solution section — LIFT Act details
9. [scroll] Who This Affects (tag cloud)
10. [scroll] Join Our Coalition (email form)
11. [scroll] Resources — Calculator, One-Pager, Testify, Share
12. Footer

**Dead ends and friction points:**

CRITICAL: After step 11, there is no petition CTA. A user who reads the full page and reaches the Resources section has been educated, is likely motivated, and the site offers them: a calculator, a PDF, an external Tally form, and a share button. The natural next action — signing the petition — is not available in the body.

CAUTION: The hero email form creates a friction checkpoint before the user understands the urgency. A user who isn't already aware of the BIRT issue lands on the hero, sees a signup form with an unexplained acronym (LIFT = Labor, Individual...) and may not understand why they should sign up. The problem section that explains the stakes comes after the signup form.

NOTE: The "Download the One-Pager" button in the hero is a download action. Downloads are exits from the page. Placing a download CTA in the hero (before the user has been convinced of anything) is unconventional and may increase bounce rate.

---

## Filing Your BIRT Flow

**Page intent:** Provide official City guidance on filing BIRT
**Audience:** Small business owners who are confused/anxious about new tax filing requirements
**Emotional state at page end:** Anxiety + awareness of the problem

The page ends with a CTA section that offers one action: "Join the Coalition." 

CRITICAL: This audience just read that they must file BIRT by April 15, they face a new tax burden, and the coalition is working to fix it. They are primed to act. But "Join the Coalition" is passive — it's a newsletter signup, not an action with impact. The petition represents tangible political action with direct impact on the legislation. This page's bottom CTA should prioritize the petition.

NOTE: There is no internal cross-link from this page to the calculator. A user reading about their BIRT obligations would naturally want to calculate their specific impact — that's the next logical step. The calculator is only accessible via nav.

---

## Calculator Flow

**Page intent:** Show users their personal tax impact
**Audience:** Business owners who want to understand their specific exposure
**Emotional state post-calculation:** Shock + anger (seeing $1,200–$3,700+ increase)

The calculator is the site's most powerful persuasion tool because it makes the problem personal. The peak persuasion moment is immediately after results appear — this is when emotional investment is highest.

**Post-result CTA path:**
1. "Annual Tax Increase" summary box (red amount)
2. "Shock Year" summary box (gold amount, dark bg)
3. Scroll indicator: "See full breakdown"
4. Warning box explaining shock year
5. Year-by-year timeline
6. "Wait, what are estimated payments?" explainer
7. "Join the Coalition" button (inside dark explainer box)

**CRITICAL dead end:** The "Join the Coalition" button appears inside the "estimated payments" explanation section — a dark navy box that visually signals "informational content," not a conversion moment. A user in scroll mode reading the breakdown may never register this CTA.

**The post-calculation CTA section** at the bottom of the page has two buttons: "Join the Coalition" and "Sign Up to Testify." Neither sends to the petition. A user who calculated their $3,000 tax increase and scrolls to the bottom of the page hits these buttons and gets... an email form, or an external Tally link.

CAUTION: The calculator's "last-updated" link in the top-right of the card (`/calculator/test-results/`) appears to be a dev/test URL. If this is publicly accessible, it may be confusing to users.

---

## Petition Page Flow

**Page intent:** Convince visitors to sign and share
**Audience:** Mix of directly affected workers, supporters, advocates

**Hero → Form path:**
1. Rotating wheel animation + hero text
2. "See everyone this affects" toggle + "Sign the Petition →" button
3. [scroll] Full petition text (considerable length — 8+ paragraphs + visual elements)
4. [scroll] Form: "Add Your Name"
5. Success state → LinkedIn share

CAUTION: The petition text is long. The "Sign the Petition →" button in the hero correctly skips the user to `#sign-section` via anchor. But a user who doesn't click the hero button and scrolls naturally must read the full petition before reaching the form. Consider a sticky "Sign Now" button that appears on scroll, or a second form link mid-petition after the "Our Ask" box — which is the natural commitment point.

CAUTION: The form has 6 rows of fields (signer type, name/biz, email/zip, website/industry, comment, anonymous). This is more friction than typical petition forms. Required fields are: name, email, zip. The optional fields add length and cognitive load. The optional fields should be collapsed by default with an "Add more details (optional) +" expand, or moved below the submit button.

NOTE: After the form there is a "Who's Signed" section with real names. This is excellent social proof. But it's below the form — a user who hasn't decided whether to sign doesn't see it. Consider surfacing the top 3-5 signers above the form as a social proof strip ("John D., contractor · Maria S., home daycare · Alex T., rideshare driver — and 241 others").

NOTE: The petition page has `meta robots: noindex`. This prevents search discovery. If this is intentional (e.g., the petition isn't ready for scale), it should be documented. If not, it should be removed immediately.

---

## Cross-Page Issues

**No breadcrumbs or "you came from" context:** A user who clicks "Sign the Petition" in the nav from the calculator page lands on the petition with no indication that their calculated amount is relevant. A URL parameter like `/petition?from=calculator&amount=2400` could pre-populate a line like "Based on your calculation, you'll owe $2,400 more — sign to fight back."

**Footer has no CTAs on any page.** The footer is a dead end. Every page footer should have: [Sign the Petition] [Join Coalition] | Contact | © 2026 LIFT Philly

**"Sign Up to Testify" link on homepage Resources section** goes to an external Tally form. If this Tally is a separate action from the petition (which it appears to be), the hierarchy of asks on the page is: 1. Email signup (hero + #join) 2. Testify (external) 3. Petition (nowhere). That hierarchy is inverted.
