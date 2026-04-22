---
role: "CRO Strategist"
mandate: "Review conversion funnel, CTA hierarchy, button prominence, placement of petition CTAs across all pages"
completed_at: "2026-04-21T21:56:00-04:00"
---

# CRO Strategist Review — LIFT Philly

## Overall Assessment

The site has a clear narrative and strong emotional hooks, but the petition — the primary conversion goal — is nearly invisible in the page body. It exists only as a nav link. Every internal CTA on every page routes to the email join form (#join), not the petition. This is a fundamental funnel misalignment: the site is set up to maximize email signups while the stated primary goal is petition signatures.

---

## Section-by-Section CTA Audit

### Homepage (index.html)

**CRITICAL: Petition CTA completely absent from page body**

The homepage body contains zero links or buttons to `/petition`. The only petition reference is the nav bar item styled gold. Every conversion action in the body routes to `/#join` (the email form):

- Hero section: Kit email signup form is the primary hero action
- Resources section buttons: Calculator, One-Pager, Testify (external), Share — no petition
- Footer: Brand only, no CTAs

The Resources section (`<section class="resources">`) is the most obvious place to add a prominent petition CTA but it's missing. The `btn-group` contains 4 buttons, none of which is the petition.

**CAUTION: Hero form competes with petition**

The hero contains an embedded Kit email signup form positioned directly below the headline and stats. This is a strong conversion element — but it's capturing the user's action intent before they've scrolled to understand the urgency. The petition, which is the higher-stakes ask, gets no hero treatment at all.

**NOTE: Stats are below the fold without a CTA**

The 75K / 85% / <1% stats appear after the email form. Stats are trust-builders that prime signing intent, but they appear after the primary CTA rather than before it.

---

### Filing Your BIRT (filing-your-birt.html)

**CRITICAL: Petition CTA completely absent**

Bottom CTA section reads:
```
"Support the LIFT Act" → "Join the Coalition →" (links to /#join)
```

This page serves users who are actively researching the tax impact — high-intent users who just read official City guidance confirming the tax is real. These are exactly the people most motivated to sign. Sending them to an email form rather than the petition is a missed conversion.

---

### Calculator (calculator/index.html)

**CRITICAL: Post-calculation moment has no petition CTA**

The calculator's highest-intent moment is immediately after a user sees their personalized tax impact number. The emotional state at that moment (shock, anger, urgency) is peak signing motivation. The current post-result flow:

1. "estimated-quote" section: "Join the Coalition" → `/#join`
2. Bottom CTA section: "Join the Coalition" + "Sign Up to Testify" (external Tally)

No petition CTA exists. This is the highest-value missed conversion on the site. A user who just calculated that they owe $2,400 more in taxes is primed to sign a petition immediately.

---

### Petition Page (petition/index.html)

**CRITICAL: `meta robots: noindex`**

The petition page is blocked from search engine indexing. For a civic advocacy campaign, organic search discovery is a major traffic driver. Anyone searching "Philadelphia BIRT tax petition" will not find this page. This is either intentional (soft launch) or a bug — either way it should be flagged.

**CAUTION: Submit button is low-contrast navy, not gold**

The `.btn-sign` submit button uses `background: var(--navy)` — the same color as the background of the sticky nav. The gold (`var(--gold)`) is reserved for the hero "Sign the Petition →" anchor, but the actual submit button does not use gold. Gold is the brand's action color throughout the site. The submit button should use gold to match the established CTA pattern.

**CAUTION: No petition progress/social proof above the form**

The signer count appears only below the form, in the "Who's Signed" section. First-time visitors who scroll to the form have no signal about how many people have signed before they decide. Moving signature count above the form (e.g., "Join 247 Philadelphians who've already signed") would increase perceived legitimacy and signing likelihood.

**NOTE: No urgency mechanism**

There is no deadline, no progress bar toward a goal, no "X more signatures needed." Civic petitions convert significantly better with a visible target (e.g., "Goal: 1,000 signatures" with a progress bar). Even an aspirational goal is more motivating than no goal.

**NOTE: After success, user is not offered coalition email signup**

After signing, the success state shows LinkedIn share options only. Adding a "Stay informed — join the coalition email list" prompt post-signature would capture the secondary conversion goal simultaneously and maintain engagement.

---

## Funnel Map

```
Homepage → Email form (hero)       [primary body CTA]
Homepage → Email form (#join)      [section CTA]
Filing BIRT → Email form (#join)   [page bottom CTA]
Calculator → Email form (#join)    [post-result CTA]
Calculator → Testify (external)    [secondary CTA]
Petition → Form → LinkedIn share   [isolated from rest of site]
```

The petition is disconnected from the rest of the funnel. No page creates a path to it except the nav.

---

## Priority Recommendations

1. **Homepage Resources section**: Add "Sign the Petition" as the primary/first button, styled with gold background (`btn-gold` class already exists on filing-your-birt.html). Change existing "Calculate Your Tax Impact" to secondary.

2. **Calculator post-result**: Add a petition CTA directly below the impact summary box, before the "Join the Coalition" button. Text: "Sign the Petition to Fix This →"

3. **Filing Your BIRT bottom CTA**: Replace or supplement "Join the Coalition" with a petition CTA. This is the highest-intent page besides the petition itself.

4. **Homepage hero**: Add a secondary CTA link below the email form pointing to `/petition` — even a text link "or sign the petition →" captures petition-ready visitors who don't want to give their email yet.

5. **Petition page**: Change submit button to gold. Add signer count above form. Add post-success email signup offer.

6. **Petition page**: Evaluate whether `noindex` is intentional. If the page is ready for public traffic, remove it.

7. **Footer**: Add petition link to footer across all pages.
