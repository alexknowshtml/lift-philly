#!/usr/bin/env node
/**
 * LIFT Philly Translation Generator
 *
 * Generates translated HTML pages from JSON translation files.
 *
 * Usage: node scripts/generate-translations.js
 *
 * This creates:
 *   /es/index.html, /es/filing-your-birt.html, /es/one-sheet.html
 *   /zh/index.html, /zh/filing-your-birt.html, /zh/one-sheet.html
 *   /vi/index.html, /vi/filing-your-birt.html, /vi/one-sheet.html
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LANGUAGES = ['es', 'zh', 'vi'];

// Language metadata
const LANG_META = {
  es: { code: 'es', name: 'Español', htmlLang: 'es' },
  zh: { code: 'zh-CN', name: '简体中文', htmlLang: 'zh-Hans' },
  vi: { code: 'vi', name: 'Tiếng Việt', htmlLang: 'vi' }
};

function loadTranslation(lang, page) {
  const filePath = path.join(ROOT, 'translations', lang, `${page}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Generate the homepage HTML
 */
function generateIndexHtml(lang, t) {
  const meta = LANG_META[lang];

  return `<!DOCTYPE html>
<html lang="${meta.htmlLang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.meta.title}</title>
    <meta name="description" content="${t.meta.description}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://liftphilly.org/${lang}/">
    <meta property="og:site_name" content="LIFT Philly">
    <meta property="og:locale" content="${meta.code.replace('-', '_')}">
    <meta property="og:title" content="${t.meta.og_title}">
    <meta property="og:description" content="${t.meta.og_description}">
    <meta property="og:image" content="https://liftphilly.org/og-image.png">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${t.meta.og_title}">
    <meta name="twitter:description" content="${t.meta.og_description}">
    <meta name="twitter:image" content="https://liftphilly.org/og-image.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles/main.css">
    <style>
        :root {
            --navy: #0f172a;
            --navy-light: #1e293b;
            --gold: #fbbf24;
            --gold-dark: #f59e0b;
            --cream: #fefce8;
            --text: #334155;
            --text-light: #64748b;
            --white: #ffffff;
            --gradient: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #1a365d 100%);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: var(--white);
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 24px;
            overflow-x: hidden;
        }

        /* Navigation */
        .nav {
            background: var(--navy);
            padding: 16px 0;
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            overflow: visible;
        }

        .nav .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            overflow: visible;
        }

        .nav-brand {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--white);
            text-decoration: none;
        }

        .nav-brand span {
            color: var(--gold);
        }

        .nav-links {
            display: flex;
            gap: 32px;
            list-style: none;
        }

        .nav-links a {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            font-size: 0.95rem;
            font-weight: 500;
            transition: color 0.2s;
        }

        .nav-links a:hover {
            color: var(--gold);
        }

        .nav-links a.active {
            color: var(--gold);
        }

        .nav-toggle {
            display: none;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
        }

        .nav-toggle span {
            display: block;
            width: 24px;
            height: 2px;
            background: var(--white);
            margin: 5px 0;
            transition: 0.3s;
        }

        @media (max-width: 768px) {
            .nav .container {
                flex-wrap: wrap;
            }

            .nav-links {
                display: none;
                position: absolute;
                top: 100%;
                right: 16px;
                left: auto;
                background: var(--navy-light);
                flex-direction: column;
                gap: 0;
                padding: 12px 0;
                margin-top: 8px;
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                min-width: 200px;
                z-index: 1000;
            }

            .nav-links.open {
                display: flex;
            }

            .nav-links li {
                padding: 0;
            }

            .nav-links a {
                display: block;
                padding: 10px 16px;
                font-size: 0.9rem;
            }

            .nav-toggle {
                display: block;
            }

            .nav-toggle.open span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }

            .nav-toggle.open span:nth-child(2) {
                opacity: 0;
            }

            .nav-toggle.open span:nth-child(3) {
                transform: rotate(-45deg) translate(5px, -5px);
            }

            /* Mobile fix for LIFT acronym section - Chinese & Vietnamese have longer text */
            .lift-acronym {
                flex-direction: column !important;
                gap: 16px !important;
                text-align: center;
            }

            .lift-acronym > div:first-child {
                order: 2;
                font-size: 0.85rem !important;
            }

            .lift-acronym > span {
                order: 1;
                font-size: 4rem !important;
            }
        }

        /* Hero */
        .hero {
            background: var(--gradient);
            min-height: 90vh;
            display: flex;
            align-items: flex-start;
            padding-top: 24px;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at 80% 20%, rgba(251,191,36,0.08) 0%, transparent 50%);
            pointer-events: none;
        }

        .hero-content {
            position: relative;
            z-index: 1;
            max-width: 700px;
        }

        .hero .badge {
            display: inline-block;
            background: rgba(251,191,36,0.15);
            color: var(--gold);
            padding: 8px 16px;
            border-radius: 100px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 24px;
            border: 1px solid rgba(251,191,36,0.3);
        }

        .hero h1 {
            font-size: clamp(2.5rem, 6vw, 4rem);
            font-weight: 800;
            color: var(--white);
            line-height: 1.1;
            margin-bottom: 20px;
            letter-spacing: -0.02em;
        }

        .hero h1 span {
            color: var(--gold);
        }

        .hero .subtitle {
            font-size: 1.25rem;
            color: rgba(255,255,255,0.8);
            margin-bottom: 40px;
            max-width: 540px;
        }

        .hero-stats {
            display: flex;
            gap: 48px;
            flex-wrap: wrap;
        }

        .hero-stat {
            text-align: left;
        }

        .hero-stat-number {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--gold);
            line-height: 1;
        }

        .hero-stat-label {
            font-size: 0.9rem;
            color: rgba(255,255,255,0.7);
            margin-top: 4px;
        }

        /* Section styling */
        section {
            padding: 100px 0;
        }

        .section-label {
            display: inline-block;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--navy);
            background: var(--gold);
            padding: 10px 20px;
            border-radius: 100px;
            margin-bottom: 20px;
        }

        .section-title {
            font-size: clamp(2rem, 4vw, 2.75rem);
            font-weight: 800;
            color: var(--navy);
            margin-bottom: 20px;
            letter-spacing: -0.02em;
            line-height: 1.15;
        }

        .section-subtitle {
            font-size: 1.1rem;
            color: var(--text);
            max-width: 600px;
        }

        .mobile-break {
            display: inline;
        }

        /* Problem section */
        .problem {
            background: linear-gradient(180deg, #f8fafc 0%, var(--white) 100%);
        }

        .problem-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 40px;
            margin-top: 60px;
        }

        .impact-card {
            background: var(--white);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 4px 40px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.05);
        }

        .impact-card h3 {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-light);
            margin-bottom: 16px;
        }

        .impact-number {
            font-size: 4rem;
            font-weight: 800;
            color: #dc2626;
            line-height: 1;
        }

        .impact-label {
            font-size: 1.1rem;
            color: var(--text);
            margin-top: 8px;
        }

        .impact-comparison {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 0.95rem;
            color: var(--text-light);
        }

        .impact-comparison strong {
            color: #dc2626;
        }

        .problem-text h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--navy);
            margin-bottom: 16px;
        }

        .problem-text p {
            color: var(--text-light);
            margin-bottom: 16px;
        }

        .quote {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--navy);
            font-style: italic;
            margin-top: 32px;
            padding-left: 24px;
            border-left: 4px solid var(--gold);
        }

        /* Solution section */
        .solution {
            background: var(--navy);
            color: var(--white);
        }

        .solution .section-label {
            color: var(--navy);
            background: var(--gold);
        }

        .solution .section-title {
            color: var(--white);
        }

        .solution .section-subtitle {
            color: rgba(255,255,255,0.7);
            max-width: 750px;
        }

        .solution-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            margin-top: 60px;
        }

        .solution-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 32px;
            transition: transform 0.2s, background 0.2s;
        }

        .solution-card:hover {
            transform: translateY(-4px);
            background: rgba(255,255,255,0.08);
        }

        .solution-icon {
            width: 48px;
            height: 48px;
            background: var(--gold);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 20px;
        }

        .solution-card h4 {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .solution-card p {
            font-size: 0.95rem;
            color: rgba(255,255,255,0.7);
            line-height: 1.6;
        }

        .timeline {
            margin-top: 60px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }

        .timeline-item {
            text-align: center;
        }

        .timeline-text {
            font-size: 1rem;
            color: rgba(255,255,255,0.9);
            line-height: 1.3;
        }

        .timeline-date {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--gold);
        }

        .timeline-item.pending .timeline-date {
            color: rgba(255,255,255,0.5);
        }

        .timeline-arrow {
            font-size: 1.5rem;
            color: var(--gold);
        }

        @media (max-width: 600px) {
            .timeline {
                flex-direction: column;
                gap: 12px;
            }

            .timeline-arrow {
                transform: rotate(90deg);
            }

            section {
                padding: 60px 0;
            }

            .hero {
                min-height: auto;
                padding: 24px 0 80px 0;
            }

            .hero h1 {
                font-size: 2rem;
            }

            .hero .subtitle {
                font-size: 1rem;
            }

            .hero-stats {
                flex-direction: column;
                gap: 24px;
            }

            .solution-grid {
                grid-template-columns: 1fr;
            }

            .impact-number {
                font-size: 2.5rem;
            }

            .impact-card {
                padding: 24px;
            }

            .mobile-break {
                display: block;
            }
        }

        /* Affected section */
        .affected {
            background: var(--cream);
        }

        .affected-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 40px;
            justify-content: center;
        }

        .affected-tag {
            background: var(--white);
            padding: 12px 24px;
            border-radius: 100px;
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--navy);
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .affected-tag:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        /* Signup section */
        .signup {
            background: linear-gradient(180deg, var(--cream) 0%, var(--white) 100%);
            text-align: center;
        }

        .signup .section-label {
            background: var(--navy);
            color: var(--gold);
        }

        .signup .section-title {
            max-width: 500px;
            margin: 0 auto 20px;
        }

        .signup .section-subtitle {
            max-width: 550px;
            font-size: 1.15rem;
        }

        .form-container {
            max-width: 480px;
            margin: 40px auto 0;
            background: var(--white);
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        /* Coalition section */
        .coalition {
            background: #f8fafc;
        }

        .coalition-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
            margin-top: 40px;
        }

        .coalition-card {
            background: var(--white);
            padding: 24px;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .coalition-card:hover {
            border-color: var(--gold);
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .coalition-card h4 {
            font-size: 1rem;
            font-weight: 600;
            color: var(--navy);
            margin-bottom: 4px;
        }

        .coalition-card p {
            font-size: 0.85rem;
            color: var(--text-light);
        }

        .coalition-cta {
            text-align: center;
            margin-top: 40px;
        }

        .coalition-cta a {
            color: var(--navy);
            font-weight: 600;
            text-decoration: none;
            border-bottom: 2px solid var(--gold);
            padding-bottom: 2px;
            transition: border-color 0.2s;
        }

        .coalition-cta a:hover {
            border-color: var(--navy);
        }

        /* Resources */
        .resources {
            background: var(--white);
            text-align: center;
            padding: 80px 0;
        }

        .btn-group {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 32px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-primary {
            background: var(--navy);
            color: var(--white);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(15,23,42,0.25);
        }

        .btn-outline {
            background: transparent;
            color: var(--navy);
            border: 2px solid var(--navy);
        }

        .btn-outline:hover {
            background: var(--navy);
            color: var(--white);
        }

        /* Footer */
        footer {
            background: var(--navy);
            color: var(--white);
            padding: 48px 0;
            text-align: center;
        }

        .footer-brand {
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 8px;
        }

        .footer-brand span {
            color: var(--gold);
        }

        footer p {
            color: rgba(255,255,255,0.6);
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="nav">
        <div class="container">
            <a href="/${lang}/" class="nav-brand">LIFT <span>Philly</span></a>
            <ul class="nav-links">
                <li><a href="/${lang}/" class="active">${t.nav.home}</a></li>
                <li><a href="/${lang}/filing-your-birt.html">${t.nav.filing_birt}</a></li>
                <li><a href="/calculator">${t.nav.calculator}</a></li>
                <li><a href="#join">${t.nav.join_coalition}</a></li>
            </ul>
            <button class="nav-toggle" onclick="toggleNav()" aria-label="Toggle navigation">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <div class="badge">${t.hero.badge}</div>
                <h1>${t.hero.headline}<br><span>${t.hero.headline_highlight}</span></h1>
                <p class="subtitle">${t.hero.subtitle}</p>
                <p class="subtitle" style="font-weight: 700;">${t.hero.subtitle_emphasis}</p>

                <div class="hero-signup" style="margin-top: 32px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 24px;">
                    <div class="lift-acronym" style="display: flex; justify-content: center; align-items: center; gap: 32px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.15);">
                        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.95rem; color: rgba(255,255,255,0.85); line-height: 1.5;">
                            <span><strong style="color: var(--gold);">L</strong>${t.hero.lift_acronym.l.replace(/^L/, '').replace(/^劳/, '劳').replace(/^Người lao động/, 'ười lao động')}</span>
                            <span><strong style="color: var(--gold);">I</strong>${t.hero.lift_acronym.i.replace(/^I/, '').replace(/^个/, '个').replace(/^Doanh/, 'oanh')}</span>
                            <span><strong style="color: var(--gold);">F</strong>${t.hero.lift_acronym.f.replace(/^F/, '').replace(/^家/, '家').replace(/^Doanh/, 'oanh')}</span>
                            <span><strong style="color: var(--gold);">T</strong>${t.hero.lift_acronym.t.replace(/^T/, '').replace(/^税/, '税').replace(/^Cải/, 'ải')}</span>
                        </div>
                        <span style="font-size: 7rem; font-weight: 800; color: var(--gold); letter-spacing: 0.05em; line-height: 0.85;">LIFT</span>
                    </div>
                    <script async data-uid="9af46470d1" src="https://lift-philly.kit.com/9af46470d1/index.js"></script>
                </div>
                <div class="hero-stats" style="margin-top: 40px; display: flex; flex-direction: column; gap: 16px; max-width: 580px; margin-left: auto; margin-right: auto;">
                    <div class="hero-stat" style="display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px 20px;">
                        <div class="hero-stat-number" style="font-size: 2rem; min-width: 80px;">${t.hero.stats.stat1_number}</div>
                        <div class="hero-stat-label" style="color: rgba(255,255,255,0.8); font-size: 0.95rem;">${t.hero.stats.stat1_label}</div>
                    </div>
                    <div class="hero-stat" style="display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px 20px;">
                        <div class="hero-stat-number" style="font-size: 2rem; min-width: 80px;">${t.hero.stats.stat2_number}</div>
                        <div class="hero-stat-label" style="color: rgba(255,255,255,0.8); font-size: 0.95rem;">${t.hero.stats.stat2_label}</div>
                    </div>
                    <div class="hero-stat" style="display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px 20px;">
                        <div class="hero-stat-number" style="font-size: 2rem; min-width: 80px;">${t.hero.stats.stat3_number}</div>
                        <div class="hero-stat-label" style="color: rgba(255,255,255,0.8); font-size: 0.95rem;">${t.hero.stats.stat3_label}</div>
                    </div>
                </div>

                <div style="margin-top: 40px; max-width: 480px; margin-left: auto; margin-right: auto; background: rgba(255,255,255,0.95); border-radius: 16px; padding: 24px 28px; border-left: 4px solid var(--gold);">
                    <blockquote style="font-size: 1.1rem; color: var(--navy); line-height: 1.6; font-style: italic; margin: 0;">
                        <p style="margin: 0;">"${t.hero.quote.text1}</p>
                        <p style="margin: 8px 0 0 0;">${t.hero.quote.text2}"</p>
                    </blockquote>
                    <cite style="display: block; margin-top: 12px; font-size: 0.95rem; color: var(--navy); font-style: normal; font-weight: 600; text-align: right;">${t.hero.quote.attribution}</cite>
                </div>

                <div style="margin-top: 24px; text-align: center;">
                    <a href="/${lang}/one-sheet.pdf" class="btn btn-outline" style="background: rgba(255,255,255,0.95); font-size: 0.95rem; padding: 12px 24px;" download>
                        📄 ${t.hero.quote.download_button}
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Problem -->
    <section class="problem">
        <div class="container">
            <div style="max-width: 660px; margin: 0 auto;">
                <div class="section-label">${t.problem.label}</div>
                <h2 class="section-title">${t.problem.title}</h2>
                <p class="section-subtitle">${t.problem.intro1}</p>
                <p class="section-subtitle" style="margin-top: 16px;">${t.problem.intro2}</p>
                <p class="section-subtitle" style="margin-top: 16px;">${t.problem.intro3}</p>
                <p class="section-subtitle" style="margin-top: 16px;"><strong>${t.problem.intro4}</strong></p>

                <h3 style="font-size: 1.75rem; font-weight: 700; color: var(--navy); margin-top: 40px; margin-bottom: 16px;">${t.problem.scale_title}</h3>
                <p class="section-subtitle">${t.problem.scale_text}</p>
            </div>
            <div class="problem-grid">
                <div class="impact-card">
                    <div style="margin-bottom: 24px; text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
                        <p style="font-size: 1.1rem; color: var(--text); margin-bottom: 8px; line-height: 1.4; font-weight: 600;">${t.problem.impact_card.condition}</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                            <span style="background: var(--cream); color: var(--navy); padding: 8px 16px; border-radius: 100px; font-weight: 600; font-size: 0.95rem; border: 2px solid var(--navy);">${t.problem.impact_card.labels.laborer}</span>
                            <span style="background: var(--cream); color: var(--navy); padding: 8px 16px; border-radius: 100px; font-weight: 600; font-size: 0.95rem; border: 2px solid var(--navy);">${t.problem.impact_card.labels.individual}</span>
                            <span style="background: var(--cream); color: var(--navy); padding: 8px 16px; border-radius: 100px; font-weight: 600; font-size: 0.95rem; border: 2px solid var(--navy);">${t.problem.impact_card.labels.family}</span>
                        </div>
                    </div>
                    <div style="margin: 24px 0;">
                        <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--navy); text-align: center; margin-bottom: 20px;">${t.problem.impact_card.result_title}</h3>
                        <div class="impact-range" style="display: flex; align-items: center; gap: 16px;">
                            <div class="impact-number">${t.problem.impact_card.impact_low}</div>
                            <div class="impact-bar-container" style="flex: 1; display: flex; align-items: center;">
                                <div class="impact-bar" style="width: 100%; height: 8px; background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%); border-radius: 4px; position: relative;">
                                    <div style="position: absolute; top: 50%; left: 0; transform: translateY(-50%); width: 16px; height: 16px; background: #dc2626; border-radius: 50%; border: 3px solid white;"></div>
                                    <div style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); width: 16px; height: 16px; background: #991b1b; border-radius: 50%; border: 3px solid white;"></div>
                                </div>
                            </div>
                            <div class="impact-number">${t.problem.impact_card.impact_high}</div>
                        </div>
                    </div>
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 1.25rem; color: var(--navy);">${t.problem.impact_card.conclusion}</p>
                    </div>
                </div>

                <div class="thomas-quote" style="background: linear-gradient(135deg, var(--navy) 0%, #1a365d 100%); border-radius: 24px; padding: 48px; position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(15,23,42,0.15); max-width: 900px; margin-left: auto; margin-right: auto;">
                    <div style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: var(--gold); border-radius: 3px 0 0 3px;"></div>
                    <blockquote style="font-size: 1.4rem; color: var(--white); line-height: 1.7; font-style: italic; margin: 0; padding-left: 24px; position: relative; z-index: 1;">
                        <p style="margin-bottom: 20px;">"${t.problem.thomas_quote.text1}</p>
                        <p>${t.problem.thomas_quote.text2}"</p>
                    </blockquote>
                    <div class="quote-footer" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px; padding-left: 24px; position: relative; z-index: 1;">
                        <a href="https://youtu.be/tRA5j_ha244?t=3751" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); color: var(--white); padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: background 0.2s;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            ${t.problem.thomas_quote.watch_button}
                        </a>
                        <div style="text-align: right;">
                            <cite style="display: block; font-size: 1.1rem; color: var(--white); font-style: normal; font-weight: 700;">${t.problem.thomas_quote.attribution}</cite>
                            <span style="font-size: 0.9rem; color: rgba(255,255,255,0.6);">${t.problem.thomas_quote.role}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="max-width: 660px; margin: 0 auto;">
                <h3 style="font-size: 1.75rem; font-weight: 700; color: var(--navy); margin-top: 40px; margin-bottom: 16px;">${t.problem.system_title}</h3>
                <p class="section-subtitle">${t.problem.system_text1}</p>
                <p class="section-subtitle" style="margin-top: 16px;">${t.problem.system_text2}</p>
            </div>
            <div style="padding-top: 48px; text-align: center; max-width: 800px; margin-left: auto; margin-right: auto;">
                <p style="font-size: 1.75rem; font-weight: 700; color: var(--navy); line-height: 1.3; margin: 0; display: inline-block; border-bottom: 4px solid var(--gold); padding-bottom: 8px;">"${t.problem.callout}"</p>
            </div>

            <div style="max-width: 700px; margin: 48px auto 0; background: var(--white); border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-left: 4px solid var(--gold);">
                <blockquote style="font-size: 1.2rem; color: var(--navy); line-height: 1.6; font-style: italic; margin: 0;">
                    <p style="margin: 0;">"${t.problem.brooks_quote.text}"</p>
                </blockquote>
                <cite style="display: block; margin-top: 16px; font-size: 0.95rem; color: var(--navy); font-style: normal; font-weight: 600; text-align: right;">${t.problem.brooks_quote.attribution}</cite>
            </div>
        </div>
    </section>

    <!-- Solution -->
    <section class="solution">
        <div class="container">
            <div class="section-label">${t.solution.label}</div>
            <h2 class="section-title">${t.solution.title}</h2>
            <p class="section-subtitle"><strong>${t.solution.subtitle}</strong></p>

            <div class="solution-grid">
                <div class="solution-card">
                    <div class="solution-icon">📋</div>
                    <h4>${t.solution.cards.exempt.title}</h4>
                    <p>${t.solution.cards.exempt.description}</p>
                </div>
                <div class="solution-card">
                    <div class="solution-icon">✓</div>
                    <h4>${t.solution.cards.npt.title}</h4>
                    <p>${t.solution.cards.npt.description}</p>
                </div>
                <div class="solution-card">
                    <div class="solution-icon">⚖️</div>
                    <h4>${t.solution.cards.legal.title}</h4>
                    <p>${t.solution.cards.legal.description}</p>
                </div>
                <div class="solution-card">
                    <div class="solution-icon" title="C.R.E.A.M. Dolla Dolla Bill Y'all">💰</div>
                    <h4>${t.solution.cards.local.title}</h4>
                    <p>${t.solution.cards.local.description}</p>
                </div>
            </div>

            <div style="max-width: 700px; margin: 60px auto 0; background: rgba(255,255,255,0.95); border-radius: 16px; padding: 32px; text-align: center;">
                <blockquote style="font-size: 1.2rem; color: var(--navy); line-height: 1.6; font-style: italic; margin: 0;">
                    <p style="margin: 0;">"${t.solution.parker_quote.text1}</p>
                    <p style="margin: 8px 0 0 0;">${t.solution.parker_quote.text2}"</p>
                </blockquote>
                <cite style="display: block; margin-top: 16px; font-size: 0.95rem; color: var(--navy); font-style: normal; font-weight: 600;">${t.solution.parker_quote.attribution}</cite>
            </div>

            <div style="text-align: center; margin-top: 60px; margin-bottom: 24px;">
                <span style="display: inline-block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--navy); background: var(--gold); padding: 10px 20px; border-radius: 100px;">${t.solution.timeline.label}</span>
            </div>
            <div class="timeline" style="margin-top: 0;">
                <div class="timeline-item completed">
                    <div class="timeline-text">${t.solution.timeline.step1_text}</div>
                    <div class="timeline-date">${t.solution.timeline.step1_date}</div>
                </div>
                <div class="timeline-arrow">→</div>
                <div class="timeline-item pending">
                    <div class="timeline-text">${t.solution.timeline.step2_text}</div>
                    <div class="timeline-date">${t.solution.timeline.step2_date}</div>
                </div>
                <div class="timeline-arrow">→</div>
                <div class="timeline-item pending">
                    <div class="timeline-text">${t.solution.timeline.step3_text}</div>
                    <div class="timeline-date">${t.solution.timeline.step3_date}</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Who This Affects -->
    <section class="affected">
        <div class="container" style="text-align: center;">
            <div class="section-label">${t.affected.label}</div>
            <h2 class="section-title">${t.affected.title}</h2>
            <p class="section-subtitle" style="margin: 0 auto;">${t.affected.subtitle}</p>

            <div class="affected-grid">
                ${t.affected.tags.map(tag => `<span class="affected-tag">${tag}</span>`).join('\n                ')}
            </div>
        </div>
    </section>

    <!-- Sign Up -->
    <section class="signup" id="join">
        <div class="container">
            <div class="section-label">${t.signup.label}</div>
            <h2 class="section-title">${t.signup.title}</h2>
            <p class="section-subtitle" style="margin: 0 auto; font-weight: 600;">${t.signup.subtitle}</p>

            <div class="form-container">
                <script async data-uid="a1dc029c21" src="https://lift-philly.kit.com/a1dc029c21/index.js"></script>
            </div>
        </div>
    </section>

    <!-- Coalition Members -->
    <section class="coalition">
        <div class="container">
            <div style="text-align: center;">
                <div class="section-label">${t.coalition.label}</div>
                <h2 class="section-title">${t.coalition.title}</h2>
            </div>

            <div style="display: flex; justify-content: center; margin: 40px 0;">
                <div class="coalition-card" style="text-align: center;">
                    <h4>${t.coalition.coming_soon}</h4>
                    <p style="color: var(--text); opacity: 0.7; margin-top: 8px;">${t.coalition.coming_soon_subtitle}</p>
                </div>
            </div>

            <div class="coalition-cta">
                <a href="https://tally.so/r/kd9g8e" target="_blank">${t.coalition.add_org}</a>
            </div>
        </div>
    </section>

    <!-- Resources -->
    <section class="resources">
        <div class="container">
            <div class="section-label">${t.resources.label}</div>
            <h2 class="section-title">${t.resources.title}</h2>
            <div class="btn-group">
                <a href="/calculator/" class="btn btn-primary">
                    ${t.resources.buttons.calculator}
                </a>
                <a href="/${lang}/one-sheet.pdf" class="btn btn-outline" target="_blank">
                    ${t.resources.buttons.one_pager}
                </a>
                <a href="https://tally.so/r/kd9g8e" class="btn btn-outline" target="_blank">
                    ${t.resources.buttons.testify}
                </a>
            </div>

            <div style="max-width: 100%; margin: 60px auto 0; text-align: center;">
                <blockquote style="font-size: 1.15rem; color: var(--text); line-height: 1.7; font-style: italic; margin: 0;">
                    "${t.resources.mays_quote.text}"
                </blockquote>
                <cite style="display: block; margin-top: 16px; font-size: 0.9rem; color: var(--text-light); font-style: normal;">
                    ${t.resources.mays_quote.attribution}<br>
                    <span style="font-size: 0.85rem;">${t.resources.mays_quote.role}</span>
                </cite>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-brand">LIFT <span>Philly</span></div>
            <p>${t.footer.tagline}</p>
            <p style="font-size: 0.75rem; opacity: 0.7; margin-top: 16px; max-width: 600px; margin-left: auto; margin-right: auto;">${t.footer.disclaimer}</p>
        </div>
    </footer>

    <script>
        function toggleNav() {
            document.querySelector('.nav-toggle').classList.toggle('open');
            document.querySelector('.nav-links').classList.toggle('open');
        }
    </script>
</body>
</html>`;
}

/**
 * Generate the BIRT guide HTML
 */
function generateBirtHtml(lang, t) {
  const meta = LANG_META[lang];
  // Get nav from index translations
  const indexT = loadTranslation(lang, 'index');

  return `<!DOCTYPE html>
<html lang="${meta.htmlLang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.meta.title}</title>
    <meta name="description" content="${t.meta.description}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://liftphilly.org/${lang}/filing-your-birt.html">
    <meta property="og:title" content="${t.meta.title}">
    <meta property="og:description" content="${t.meta.description}">
    <meta property="og:image" content="https://liftphilly.org/og-image.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --navy: #0f172a;
            --navy-light: #1e293b;
            --gold: #fbbf24;
            --gold-dark: #f59e0b;
            --cream: #fefce8;
            --text: #334155;
            --text-light: #64748b;
            --white: #ffffff;
            --gradient: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #1a365d 100%);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: var(--white);
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* Navigation */
        .nav {
            background: var(--navy);
            padding: 16px 0;
            position: sticky;
            top: 0;
            z-index: 100;
            overflow: visible;
        }

        .nav .container {
            max-width: 1100px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            overflow: visible;
        }

        .nav-brand {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--white);
            text-decoration: none;
        }

        .nav-brand span { color: var(--gold); }

        .nav-links {
            display: flex;
            gap: 32px;
            list-style: none;
        }

        .nav-links a {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            font-size: 0.95rem;
            font-weight: 500;
            transition: color 0.2s;
        }

        .nav-links a:hover { color: var(--gold); }
        .nav-links a.active { color: var(--gold); }

        .nav-toggle {
            display: none;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
        }

        .nav-toggle span {
            display: block;
            width: 24px;
            height: 2px;
            background: var(--white);
            margin: 5px 0;
            transition: 0.3s;
        }

        @media (max-width: 768px) {
            .nav .container { flex-wrap: wrap; }

            .nav-links {
                display: none;
                position: absolute;
                top: 100%;
                right: 16px;
                background: var(--navy-light);
                flex-direction: column;
                gap: 0;
                padding: 12px 0;
                margin-top: 8px;
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                min-width: 200px;
                z-index: 1000;
            }

            .nav-links.open { display: flex; }
            .nav-links li { padding: 0; }
            .nav-links a { display: block; padding: 10px 16px; font-size: 0.9rem; }
            .nav-toggle { display: block; }

            .nav-toggle.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
            .nav-toggle.open span:nth-child(2) { opacity: 0; }
            .nav-toggle.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        }

        /* Page header */
        .page-header {
            background: var(--gradient);
            padding: 60px 0;
            text-align: center;
        }

        .page-header h1 {
            font-size: clamp(1.75rem, 4vw, 2.5rem);
            font-weight: 800;
            color: var(--white);
            margin-bottom: 12px;
        }

        .page-header .subtitle {
            color: rgba(255,255,255,0.8);
            font-size: 1.1rem;
        }

        .source-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 100px;
            margin-top: 20px;
            font-size: 0.9rem;
            color: rgba(255,255,255,0.9);
            position: relative;
            cursor: default;
        }

        .source-badge svg { width: 16px; height: 16px; }

        .source-badge .tooltip {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: var(--navy);
            color: white;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 0.8rem;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s, visibility 0.2s;
            margin-top: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .source-badge .tooltip::after {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 6px solid transparent;
            border-bottom-color: var(--navy);
        }

        .source-badge:hover .tooltip { opacity: 1; visibility: visible; }

        /* Content */
        .content {
            padding: 60px 0;
            background: #f8f9fa;
        }

        .letter {
            background: var(--white);
            border-radius: 4px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
            padding: 48px 56px;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
        }

        .letter::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, var(--navy) 0%, var(--navy) 70%, var(--gold) 70%, var(--gold) 100%);
            border-radius: 4px 4px 0 0;
        }

        .letter-header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }

        .letter-meta {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 12px 16px;
            font-size: 0.95rem;
            align-items: center;
        }

        .letter-meta dt {
            font-weight: 600;
            color: var(--text-light);
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
        }

        .letter-meta dd {
            color: var(--navy);
            font-weight: 500;
            margin: 0;
        }

        .letter-date {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            color: var(--text-light);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .letter-date .email-link {
            display: inline-flex;
            align-items: center;
            color: var(--text-light);
            transition: color 0.2s;
        }

        .letter-date .email-link:hover { color: var(--gold-dark); }
        .letter-date .email-link svg { width: 16px; height: 16px; }

        .letter-body h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--navy);
            margin: 40px 0 16px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }

        .letter-body h2:first-child { margin-top: 0; padding-top: 0; border-top: none; }
        .letter-body h3 { font-size: 1.15rem; font-weight: 600; color: var(--navy); margin: 24px 0 12px; }
        .letter-body p { margin-bottom: 16px; line-height: 1.7; }
        .letter-body ul { margin: 16px 0; padding-left: 24px; }
        .letter-body li { margin-bottom: 12px; line-height: 1.7; }

        .letter-body a {
            color: var(--navy);
            font-weight: 500;
            text-decoration: underline;
            text-decoration-color: var(--gold);
            text-underline-offset: 3px;
        }

        .letter-body a:hover { color: var(--gold-dark); }

        .highlight-box {
            background: var(--cream);
            border-left: 4px solid var(--gold);
            padding: 20px 24px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }

        .highlight-box p:last-child { margin-bottom: 0; }

        .important-box {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 20px 24px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }

        .important-box strong { color: #dc2626; }

        .contact-box {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            padding: 24px;
            margin: 32px 0;
            border-radius: 12px;
            text-align: center;
        }

        .contact-box p { margin-bottom: 8px; }
        .contact-box .phone { font-size: 1.5rem; font-weight: 700; color: var(--navy); }

        /* CTA section */
        .cta-section {
            background: var(--navy);
            padding: 60px 0;
            text-align: center;
        }

        .cta-section h2 { color: var(--white); font-size: 1.75rem; margin-bottom: 12px; }
        .cta-section p { color: rgba(255,255,255,0.8); margin-bottom: 24px; }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-gold { background: var(--gold); color: var(--navy); }
        .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(251,191,36,0.35); }

        /* Footer */
        footer {
            background: var(--navy);
            color: var(--white);
            padding: 48px 0;
            text-align: center;
        }

        .footer-brand { font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; }
        .footer-brand span { color: var(--gold); }
        footer p { color: rgba(255,255,255,0.6); font-size: 0.9rem; }

        @media (max-width: 768px) {
            .page-header { padding: 40px 0; }
            .content { padding: 40px 0; }
            .letter { padding: 24px 20px; }
            .letter-meta { grid-template-columns: 1fr; gap: 4px; }
            .letter-meta dt { margin-top: 12px; }
            .letter-meta dt:first-child { margin-top: 0; }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="nav">
        <div class="container">
            <a href="/${lang}/" class="nav-brand">LIFT <span>Philly</span></a>
            <button class="nav-toggle" onclick="toggleNav()" aria-label="Toggle navigation">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <ul class="nav-links">
                <li><a href="/${lang}/">${indexT.nav.home}</a></li>
                <li><a href="/${lang}/filing-your-birt.html" class="active">${indexT.nav.filing_birt}</a></li>
                <li><a href="/calculator">${indexT.nav.calculator}</a></li>
                <li><a href="/${lang}/#join">${indexT.nav.join_coalition}</a></li>
            </ul>
        </div>
    </nav>

    <!-- Page Header -->
    <header class="page-header">
        <div class="container">
            <h1>${t.header.title}<br>${t.header.title_line2}</h1>
            <p class="subtitle">${t.header.subtitle}</p>
            <div class="source-badge">
                <span class="tooltip">${t.header.source_tooltip}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                ${t.header.source_badge}
            </div>
        </div>
    </header>

    <!-- Content -->
    <main class="content">
        <div class="container">
            <article class="letter">
                <header class="letter-header">
                    <dl class="letter-meta">
                        <dt>From</dt>
                        <dd>${t.letter.from}</dd>
                        <dt>To</dt>
                        <dd>${t.letter.to}</dd>
                    </dl>
                    <div class="letter-date">
                        ${t.letter.date}
                        <a href="https://myemail.constantcontact.com/What-you-need-to-know-before-filing-your-first-BIRT.html?soid=1120526976020&aid=Ttl7j9SNh5Q" target="_blank" class="email-link" title="${t.letter.view_original}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </a>
                    </div>
                </header>

                <div class="letter-body">
                    <p>${t.content.intro1}</p>
                    <p>${t.content.intro2}</p>

                    <h2>${t.content.mandatory_title}</h2>

                    <div class="important-box">
                        <p><strong>${t.content.mandatory_alert}</strong></p>
                    </div>

                    <p>${t.content.mandatory_p1}</p>
                    <p>${t.content.mandatory_p2}</p>

                    <h2>${t.content.estimated_title}</h2>

                    <div class="highlight-box">
                        <p>${t.content.estimated_highlight}</p>
                    </div>

                    <p>${t.content.estimated_p1} <a href="https://www.phila.gov/2025-08-12-what-anyone-doing-business-in-philly-needs-to-know-about-estimated-tax-payments/">${t.content.estimated_link_text}</a>.</p>

                    <h2>${t.content.not_changing_title}</h2>

                    <h3>${t.content.npt_credit_title}</h3>
                    <p>${t.content.npt_credit_p1}</p>

                    <h3>${t.content.lcf_title}</h3>
                    <p>${t.content.lcf_p1}</p>

                    <h2>${t.content.reminders_title}</h2>

                    <ul>
                        ${t.content.reminders.map(r => `<li><strong>${r.title}</strong> ${r.text}</li>`).join('\n                        ')}
                    </ul>

                    <div class="contact-box">
                        <p><strong>${t.content.contact_title}</strong></p>
                        <p class="phone">${t.content.contact_phone}</p>
                        <p style="color: var(--text-light); font-size: 0.9rem;">${t.content.contact_hours}</p>
                    </div>

                    <h2>${t.content.free_prep_title}</h2>

                    <div class="highlight-box">
                        <p><strong>${t.content.free_prep_highlight}</strong></p>
                    </div>

                    <p>${t.content.free_prep_p1}</p>

                    <h2>${t.content.eitc_title}</h2>

                    <p>${t.content.eitc_p1}</p>
                    <p>${t.content.eitc_p2}</p>
                </div>
            </article>
        </div>
    </main>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="container">
            <h2>${t.cta.title}</h2>
            <p>${t.cta.subtitle}</p>
            <a href="/${lang}/#join" class="btn btn-gold">${t.cta.button}</a>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-brand">LIFT <span>Philly</span></div>
            <p>${indexT.footer.tagline}</p>
            <p style="font-size: 0.75rem; opacity: 0.7; margin-top: 16px; max-width: 600px; margin-left: auto; margin-right: auto;">${indexT.footer.disclaimer}</p>
        </div>
    </footer>

    <script>
        function toggleNav() {
            document.querySelector('.nav-toggle').classList.toggle('open');
            document.querySelector('.nav-links').classList.toggle('open');
        }
    </script>
</body>
</html>`;
}

/**
 * Generate the one-sheet PDF page (simplified for print)
 */
function generateOneSheetHtml(lang, t) {
  const meta = LANG_META[lang];

  return `<!DOCTYPE html>
<html lang="${meta.htmlLang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.meta.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --navy: #0f172a;
            --navy-light: #1e293b;
            --gold: #fbbf24;
            --gold-dark: #f59e0b;
            --text: #334155;
            --text-light: #64748b;
            --red: #dc2626;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page { size: letter; margin: 0.5in; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: var(--text);
            background: white;
        }

        .page {
            width: 7.5in;
            min-height: 10in;
            max-height: 10in;
            padding: 0;
            page-break-after: always;
            overflow: hidden;
            position: relative;
        }

        .page:last-child { page-break-after: avoid; }

        .header {
            background: var(--navy);
            color: white;
            padding: 16px 20px;
            margin: -0.5in -0.5in 16px -0.5in;
            width: calc(100% + 1in);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo { font-size: 28pt; font-weight: 800; letter-spacing: 0.05em; }
        .logo span { color: var(--gold); }

        .acronym { font-size: 8pt; color: rgba(255,255,255,0.9); text-align: left; line-height: 1.5; }
        .acronym-item { white-space: nowrap; }
        .acronym-letter { color: var(--gold); font-weight: 700; }

        h2 {
            font-size: 12pt;
            font-weight: 800;
            color: var(--navy);
            margin: 16px 0 8px 0;
            padding-bottom: 4px;
            border-bottom: 2px solid var(--gold);
        }

        h3 { font-size: 10pt; font-weight: 700; color: var(--navy); margin: 10px 0 6px 0; }

        .principles {
            background: #f8fafc;
            border-left: 4px solid var(--gold);
            padding: 10px 12px;
            margin-bottom: 12px;
        }

        .principles p { margin-bottom: 4px; font-size: 9pt; }
        .principles strong { color: var(--navy); }

        .stat-box {
            background: var(--navy);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 10px 0;
            text-align: center;
        }

        .stat-number { font-size: 24pt; font-weight: 800; color: var(--gold); }
        .stat-label { font-size: 9pt; opacity: 0.9; }

        .impact-box {
            background: #fef2f2;
            border: 2px solid var(--red);
            border-radius: 8px;
            padding: 12px;
            margin: 10px 0;
        }

        .impact-box h3 { color: var(--red); margin-top: 0; }
        .impact-amount { font-size: 16pt; font-weight: 800; color: var(--red); }
        .impact-examples { font-size: 9pt; color: var(--text-light); margin-top: 4px; }

        .solution-box {
            background: #f0fdf4;
            border: 2px solid #16a34a;
            border-radius: 8px;
            padding: 12px;
            margin: 10px 0;
        }

        .solution-box h3 { color: #16a34a; margin-top: 0; }
        .checkmark { color: #16a34a; font-weight: bold; }
        .result { font-size: 11pt; font-weight: 700; color: #16a34a; margin-top: 8px; }

        ul { margin-left: 16px; margin-bottom: 8px; }
        li { margin-bottom: 3px; }

        .two-col { display: flex; gap: 16px; }
        .two-col > div { flex: 1; }

        .qr-section {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #f8fafc;
            padding: 10px 12px;
            border-radius: 8px;
            margin-top: 12px;
        }

        .qr-code {
            width: 70px;
            height: 70px;
            background: white;
            border: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .qr-code img { width: 100%; height: 100%; }
        .qr-text { flex: 1; }
        .qr-text strong { display: block; font-size: 10pt; color: var(--navy); }
        .qr-text span { font-size: 8pt; color: var(--text-light); }

        .action-item {
            background: #f8fafc;
            padding: 10px 12px;
            border-radius: 6px;
            margin-bottom: 8px;
        }

        .action-number {
            display: inline-block;
            width: 20px;
            height: 20px;
            background: var(--navy);
            color: white;
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            font-size: 9pt;
            font-weight: 700;
            margin-right: 6px;
        }

        .conversation-prompt {
            background: var(--gold);
            color: var(--navy);
            padding: 10px 12px;
            border-radius: 6px;
            font-style: italic;
            font-weight: 700;
            margin: 8px 0;
            font-size: 9pt;
        }

        .voices-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 16px;
            font-size: 8.5pt;
        }

        .voices-grid li { margin-bottom: 2px; }

        .bill-status {
            background: var(--navy);
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
        }

        .bill-status h3 { color: var(--gold); margin: 0 0 8px 0; font-size: 10pt; }
        .bill-status ul { margin-left: 16px; font-size: 9pt; }
        .bill-status li { margin-bottom: 4px; color: rgba(255,255,255,0.9); }

        .footer {
            margin-top: auto;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
        }

        .footer-cta { font-weight: 700; color: var(--navy); }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { margin: 0; padding: 0; }
            .header { margin: 0 0 16px 0; width: 100%; }
        }
    </style>
</head>
<body>
    <!-- PAGE 1: The Problem & Solution -->
    <div class="page">
        <div class="header">
            <div>
                <div class="logo">${t.header.brand.replace('Philly', '<span>Philly</span>')}</div>
                <div style="font-size: 8pt; color: rgba(255,255,255,0.7); margin-top: 2px;">${t.header.website}</div>
            </div>
            <div class="acronym">
                <span class="acronym-item"><span class="acronym-letter">L</span>${t.header.acronym.l.replace(/^L/, '')}</span><br>
                <span class="acronym-item"><span class="acronym-letter">I</span>${t.header.acronym.i.replace(/^I/, '')}</span><br>
                <span class="acronym-item"><span class="acronym-letter">F</span>${t.header.acronym.f.replace(/^F/, '')}</span><br>
                <span class="acronym-item"><span class="acronym-letter">T</span>${t.header.acronym.t.replace(/^T/, '')}</span>
            </div>
        </div>

        <div class="principles">
            <p><strong>${t.principles.p1_title}</strong> ${t.principles.p1_text}</p>
            <p><strong>${t.principles.p2_title}</strong> ${t.principles.p2_text}</p>
            <p><strong>${t.principles.p3_title}</strong> ${t.principles.p3_text}</p>
        </div>

        <h2>${t.problem.title}</h2>
        <p>${t.problem.intro} <strong>${t.problem.shield_gone}</strong></p>

        <div class="impact-box" style="padding: 12px; display: flex; gap: 16px; align-items: center;">
            <div style="flex: 1;">
                <p style="font-size: 10pt; margin: 0 0 6px 0; color: var(--text);">${t.problem.impact_card.condition}</p>
                <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                    <span style="display: inline-block; padding: 4px 10px; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 8pt; color: var(--text);">${t.problem.impact_card.labels.laborer}</span>
                    <span style="display: inline-block; padding: 4px 10px; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 8pt; color: var(--text);">${t.problem.impact_card.labels.individual}</span>
                    <span style="display: inline-block; padding: 4px 10px; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 8pt; color: var(--text);">${t.problem.impact_card.labels.family}</span>
                </div>
                <p style="font-size: 11pt; margin: 0 0 8px 0; color: var(--navy); font-weight: 600;">${t.problem.impact_card.result_title}</p>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <p class="impact-amount" style="font-size: 28pt; margin: 0; line-height: 1;">${t.problem.impact_card.impact_low}</p>
                    <div style="width: 80px; height: 4px; background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%); border-radius: 2px;"></div>
                    <p class="impact-amount" style="font-size: 28pt; margin: 0; line-height: 1;">${t.problem.impact_card.impact_high}</p>
                </div>
                <p class="impact-examples" style="margin: 10px 0 0 0; font-size: 9pt; font-weight: 700; color: var(--navy);">${t.problem.impact_card.conclusion}</p>
            </div>
            <div style="text-align: center; padding-left: 16px; border-left: 1px solid rgba(220,38,38,0.3); flex-shrink: 0;">
                <div style="width: 70px; height: 70px; background: white; border-radius: 4px; margin: 0 auto;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://liftphilly.org/calculator/" alt="QR Code" style="width: 100%; height: 100%;">
                </div>
                <strong style="color: var(--red); font-size: 8pt; display: block; margin-top: 6px;">${t.problem.impact_card.qr_cta}</strong>
                <span style="font-size: 7pt; color: var(--text);">${t.problem.impact_card.qr_url}</span>
            </div>
        </div>

        <div class="stat-box" style="display: flex; gap: 20px; align-items: center;">
            <div style="text-align: center; flex-shrink: 0;">
                <div class="stat-number" style="margin-bottom: 0; line-height: 1;">${t.problem.stat_number}</div>
                <div style="font-size: 9pt; color: rgba(255,255,255,0.8); margin-top: 0;">${t.problem.stat_context}</div>
            </div>
            <div class="stat-label" style="flex: 1; text-align: left;">${t.problem.stat_description}</div>
        </div>

        <h2>${t.solution.title}</h2>
        <p>${t.solution.intro}</p>
        <p style="margin-top: 6px;">${t.solution.class_description}</p>

        <div style="display: flex; align-items: center; gap: 8px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 8px 12px; margin: 10px 0;">
            <div style="background: #10b981; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12pt; flex-shrink: 0;">✓</div>
            <div style="font-size: 8pt; font-weight: 700;">${t.solution.uniformity_clause}</div>
        </div>

        <div style="margin-top: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 10pt; color: var(--navy);">${t.solution.enables_title}</h3>
            <ul style="list-style: none; margin: 0; padding: 0; font-size: 9pt;">
                ${t.solution.enables.map(item => `<li style="margin-bottom: 4px;"><span style="color: var(--navy); font-weight: 700;">✓</span> ${item}</li>`).join('')}
            </ul>
            <div style="background: #fefce8; border: 2px solid var(--gold); border-radius: 8px; padding: 12px; margin-top: 10px;">
                <p style="font-size: 9pt; font-weight: 700; color: var(--navy); margin: 0 0 6px 0; text-align: center;">${t.solution.result}</p>
                <p style="font-size: 8pt; font-weight: 700; font-style: italic; color: var(--text); margin: 0; text-align: center;">${t.solution.lift_class_note}</p>
            </div>
        </div>
    </div>

    <!-- PAGE 2: Take Action -->
    <div class="page">
        <div class="header">
            <div>
                <div class="logo">${t.header.brand.replace('Philly', '<span>Philly</span>')}</div>
                <div style="font-size: 8pt; color: rgba(255,255,255,0.7); margin-top: 2px;">${t.header.website}</div>
            </div>
            <div style="font-size: 14pt; font-weight: 800; color: white;">${t.page2.title}</div>
        </div>

        <div class="action-item" style="display: flex; gap: 16px; align-items: center;">
            <div style="flex: 1;">
                <h3><span class="action-number">1</span> ${t.action1.title}</h3>
                <p>${t.action1.description}</p>
            </div>
            <div style="text-align: center; padding-left: 16px; border-left: 1px solid #e5e7eb; flex-shrink: 0;">
                <div style="width: 60px; height: 60px; background: white; border-radius: 4px; margin: 0 auto;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://liftphilly.org/calculator/" alt="QR Code" style="width: 100%; height: 100%;">
                </div>
                <strong style="color: var(--red); font-size: 7pt; display: block; margin-top: 4px;">${t.action1.qr_cta}</strong>
                <span style="font-size: 7pt; color: var(--text);">${t.action1.qr_url}</span>
            </div>
        </div>

        <div class="two-col" style="gap: 12px; margin-bottom: 8px;">
            <div class="action-item" style="flex: 1; margin-bottom: 0;">
                <h3><span class="action-number">2</span> ${t.action2.title}</h3>
                <p style="margin-bottom: 4px;">${t.action2.intro}</p>
                <div style="background: #fef2f2; border: 2px solid var(--red); border-radius: 8px; padding: 8px 10px; font-size: 8pt; font-style: italic; font-weight: 700; color: var(--text);">
                    ${t.action2.prompt}
                </div>
                <p style="margin-top: 4px;">${t.action2.followup}</p>
            </div>
            <div class="action-item" style="flex: 1; margin-bottom: 0;">
                <h3><span class="action-number">3</span> ${t.action3.title}</h3>
                <p>${t.action3.p1}</p>
                <p style="margin-top: 6px;">${t.action3.p2}</p>
            </div>
        </div>

        <div class="action-item">
            <h3><span class="action-number">4</span> ${t.action4.title}</h3>
            <p style="margin-bottom: 8px;">${t.action4.intro}</p>
            <div class="two-col" style="gap: 16px;">
                <div>
                    <ul class="voices-grid" style="display: block; font-size: 8pt; margin: 0; padding-left: 16px;">
                        ${t.action4.categories.slice(0, 12).map(cat => `<li>${cat}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <ul class="voices-grid" style="display: block; font-size: 8pt; margin: 0; padding-left: 16px;">
                        ${t.action4.categories.slice(12).map(cat => `<li>${cat}</li>`).join('')}
                        <li><strong><em>${t.action4.categories_suffix}</em></strong></li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="bill-status" style="display: flex; gap: 16px; align-items: center;">
            <div style="flex: 1;">
                <h3>${t.bill_status.title}</h3>
                <ul>
                    ${t.bill_status.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <div style="text-align: center; padding-left: 16px; border-left: 1px solid rgba(251,191,36,0.3); flex-shrink: 0;">
                <div style="width: 70px; height: 70px; background: white; border-radius: 4px; margin: 0 auto;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://liftphilly.org/" alt="QR Code" style="width: 100%; height: 100%;">
                </div>
                <strong style="color: var(--gold); font-size: 8pt; display: block; margin-top: 6px;">${t.bill_status.qr_cta}</strong>
                <span style="font-size: 7pt; color: rgba(255,255,255,0.8);">${t.bill_status.qr_url}</span>
            </div>
        </div>

        <div class="footer">
            <div class="footer-cta">${t.footer.cta}</div>
            <div>${t.footer.email}</div>
        </div>
        <div style="font-size: 7pt; opacity: 0.7; text-align: center; position: absolute; bottom: 0; left: 0; right: 0;">${t.footer.disclaimer}</div>
    </div>
</body>
</html>`;
}

// Main execution
console.log('Generating translated pages...\n');

LANGUAGES.forEach(lang => {
  console.log(`Processing ${LANG_META[lang].name} (${lang})...`);

  // Create directories
  const langDir = path.join(ROOT, lang);
  const calcDir = path.join(langDir, 'calculator');

  if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });
  if (!fs.existsSync(calcDir)) fs.mkdirSync(calcDir, { recursive: true });

  // Generate homepage
  const indexT = loadTranslation(lang, 'index');
  const indexHtml = generateIndexHtml(lang, indexT);
  fs.writeFileSync(path.join(langDir, 'index.html'), indexHtml);
  console.log(`  ✓ ${lang}/index.html`);

  // Generate BIRT guide
  const birtT = loadTranslation(lang, 'birt');
  const birtHtml = generateBirtHtml(lang, birtT);
  fs.writeFileSync(path.join(langDir, 'filing-your-birt.html'), birtHtml);
  console.log(`  ✓ ${lang}/filing-your-birt.html`);

  // Generate one-sheet
  const oneSheetT = loadTranslation(lang, 'one-sheet');
  const oneSheetHtml = generateOneSheetHtml(lang, oneSheetT);
  fs.writeFileSync(path.join(langDir, 'one-sheet.html'), oneSheetHtml);
  console.log(`  ✓ ${lang}/one-sheet.html`);
});

console.log('\nDone! Generated index.html, filing-your-birt.html, and one-sheet.html for all languages.');
