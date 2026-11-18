# Farm Power Math: static site package (draft, not published)

Built by Soraya (Claude) on Nov 18, 2026 from the approved prototype (11-farm-power-math.html) for task-2026-11-18-007.

## What's here
- `index.html`: home page linking the three calculators
- `wire-size-voltage-drop/`, `battery-solar-sizing/`, `generator-size/`: one page per calculator, each with its own SEO title, description, canonical URL, structured data, the electrician warning, and a plain-English "how this works" section
- `about/`, `privacy/`, `disclaimer/`, `404.html`
- `calc.js`: the calculator code (unchanged math; each calculator now only starts on its own page)
- `robots.txt`, `sitemap.xml`, `_headers` (security headers for Cloudflare Pages), `favicon.svg`

Ad slots stay hidden (`.adslot { display: none; }`) and there are no affiliate links. Both need separate approval.

## Publish on Cloudflare Pages (Commander's steps; free plan allows commercial use)
1. Commander creates a Cloudflare account himself (Soraya never handles logins).
2. Workers & Pages → Create → Pages → **Upload assets** → name the project (e.g. `farmpowermath`, giving `farmpowermath.pages.dev`) → upload this folder.
3. If the name differs from `farmpowermath`, replace `https://farmpowermath.pages.dev` in all files (one find-and-replace), or ask Soraya to rebuild.
4. Optional, costs money (needs approval): a custom domain.
5. After it's live: submit `sitemap.xml` in Google Search Console (free; Commander's account).

Before publishing, fill in "[date of publication]" on the privacy page.
