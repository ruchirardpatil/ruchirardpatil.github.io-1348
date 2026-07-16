# Ruchira Patil — Portfolio

Personal portfolio site for **Ruchira Dayanand Patil**, Software Development Engineer.

Vanilla HTML / CSS / JavaScript. JSON-driven content, no build step, and **no external
dependencies** — fonts are self-hosted and every icon is an inline SVG, so the page has zero
CDN requests.

## Design

An "instrument panel" direction: deep teal-slate background, telemetry-amber accent, and
IBM Plex Mono used as a structural / readout typeface (paired with Space Grotesk for display
and IBM Plex Sans for body). No particles, no gradient orbs.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works — the site is plain files. It must be *served* (not opened as
`file://`) because content is loaded from `data/*.json` via `fetch`.

## Editing content

All copy lives in `data/*.json`; the markup is generated from it at runtime by
`assets/js/main.js`. Common edits:

| File | Controls |
|------|----------|
| `data/site-config.json` | `<title>` and meta (also hard-coded in `index.html` for crawlers) |
| `data/hero.json` | hero status line, metrics, CTAs, socials |
| `data/about.json` | about narrative + stat readout |
| `data/experience.json` | work timeline |
| `data/skills.json` | stack categories |
| `data/projects.json` | project cards (each cover is generated from `seed` + `accent`) |
| `data/education.json` | degrees + certifications |
| `data/contact.json` | contact channels (direct links; no server form) |
| `data/footer.json` | footer |

**Icons** are referenced by short name (e.g. `"mail"`, `"github"`, `"database"`) and resolve
to the inline SVG sprite at the top of `index.html`. To add one, drop a new `<symbol id="icon-…">`
into that sprite.

**Accent** on most items is `"amber"` or `"cyan"`.

### The `<head>` is authored, not generated

`index.html` contains the real `<title>`, description, canonical URL, Open Graph and Twitter
tags so link previews and crawlers work without running JavaScript. Update
`https://ruchirardpatil.github.io/` there if the site moves to a custom domain, and regenerate
`assets/images/og-cover.png` if the branding changes.

## Structure

```
├── index.html                 # shell + SVG icon sprite + authored <head>
├── assets/
│   ├── css/styles.css         # design system
│   ├── js/main.js             # JSON-driven rendering + interactions
│   ├── fonts/                 # self-hosted woff2 (Space Grotesk, IBM Plex Sans/Mono)
│   ├── images/                # favicon.svg, og-cover.png
│   └── files/resume.pdf
└── data/*.json                # all content
```

## Deploy

Push to `main` and enable GitHub Pages (Settings → Pages → deploy from `main`, root).
Live at `https://ruchirardpatil.github.io/`.
