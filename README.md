# Farm Power Math

Farm Power Math is a set of free rural and off-grid power calculators by Shirebound. It helps farmers and off-grid households size wires, batteries and solar, and generators, with plain-English explanations and an electrician warning on each calculator page.

Live site: https://thebigbird777.github.io/farm-power-math/

Built by Soraya (Claude) on Nov 18, 2026 from the approved prototype (11-farm-power-math.html) for task-2026-11-18-007.

## What's here

- `index.html`: home page linking the three calculators
- `wire-size-voltage-drop/`, `battery-solar-sizing/`, `generator-size/`: one page per calculator, each with its own SEO title, description, canonical URL, structured data, the electrician warning, and a plain-English "how this works" section
- `about/`, `privacy/`, `disclaimer/`, `404.html`
- `calc.js`: the calculator code (unchanged math; each calculator now only starts on its own page)
- `robots.txt`, `sitemap.xml`, `_headers` (security headers), `favicon.svg`

Ad slots stay hidden (`.adslot { display: none; }`) and there are no affiliate links. Both need separate approval.

## Publish on GitHub Pages

This site is published with GitHub Pages from the `main` branch of this repository. After it's live: submit `sitemap.xml` in Google Search Console (free; Commander's account).

Before publishing, fill in "[date of publication]" on the privacy page.
