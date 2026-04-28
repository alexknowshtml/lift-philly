# LIFT Philly

Static website for the LIFT Act coalition - tax relief for Philadelphia's solo businesses.

## What is the LIFT Act?

The LIFT Act would create a third tax class for individuals and single-member LLCs, exempting them from the BIRT Net Income Tax (5.71%) while maintaining other tax obligations.

- **75,000** small businesses affected
- **85%** of Philadelphia businesses are non-employer firms
- **<1%** impact on city budget

## Deployment

This site is deployed to Netlify. Any push to `main` triggers a new deployment.

## Local Development

Just open `index.html` in a browser, or serve locally:

```
python3 -m http.server 8080
```

## Translation Workflow

Translated pages live in `es/`, `zh/`, `vi/` subdirectories. Human translators work from CSV files — they never touch HTML or JSON directly.

### One-time setup

```
git config core.hooksPath .githooks
```

Activates the pre-commit hook that auto-updates `translations/en/*.json` whenever you edit English HTML. Run once per clone.

### Editing English copy

1. Edit the HTML page directly
2. Commit — the pre-commit hook runs `extract-translations.js` automatically and stages the updated JSON

### Sending to translators

```
node scripts/export-translations.js
```

Generates CSVs in `translations/export/`. Send all CSVs to translators. They fill in their language column for rows marked `new` or `changed` only.

- `common.csv` — nav and footer (shared across all pages, fill once)
- `index.csv`, `birt.csv`, etc. — page-specific content

### Importing translations

```
node scripts/import-translations.js --page=index --lang=es --file=translations/export/index.csv
```

Upserts translated values into `translations/es/index.json`. Repeat for each page/language combination.

### Generating translated pages

```
node scripts/generate-translations-new.js
```

Or for a single page/language:

```
node scripts/generate-translations-new.js --lang=es --page=index
```

### Auditing for unannotated text

Run before translator handoffs to catch copy added without `data-i18n`:

```
node scripts/audit-unannotated.js
```

Exits 1 if issues found, listing the elements and their text.

### Key files

| Path | Purpose |
|------|---------|
| `_includes/nav.html` | Shared nav — annotate here, `build-nav.js` propagates to all pages |
| `_includes/footer.html` | Shared footer — same as above |
| `translations/en/` | English source JSON (auto-updated by pre-commit hook) |
| `translations/{lang}/` | Translated JSON (updated by import script) |
| `translations/export/` | CSVs for translators (gitignored) |

## Links

- [One-Pager](https://docs.google.com/document/d/1GSzoetFV-clBDcLri4p0ypxykaD5gjNfWoHiR1CKHLE/edit?usp=sharing)
- [Coalition Sign-Up (Tally)](https://tally.so/r/kd9g8e)
- [Email List (Kit)](https://lift-philly.kit.com)
