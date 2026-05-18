# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hugo Extended static site for **Bergen Ship Agency**, a Norwegian port agency (Bergen-based). Production domain: `https://bergenshipagency.no/`. Content is in English. Customer-facing marketing site — no backend, no JS framework, no package manager.

## Commands

- `hugo server -D` — local dev server with drafts (default http://localhost:1313).
- `hugo` — production build to `public/`.
- `hugo new content services/<slug>.md` — scaffold from `archetypes/default.md` (creates a draft).

Hugo **Extended** is required (Hugo Pipes minifies CSS/JS at build time — see `layouts/_default/baseof.html`). There is no Node toolchain, no test suite, no linter.

## Architecture

### Custom layouts, no theme

`themes/` is intentionally empty. All templates live under `layouts/` and override Hugo defaults directly. When adding pages, prefer extending the existing layout system over introducing a theme.

Layout lookup that matters here:

- `layouts/_default/baseof.html` — single base wrapping every page, loads Google Fonts + minified `main.css`/`main.js`.
- `layouts/index.html` — homepage (hero + services grid + why-us + CTA). The services grid is **data-driven**: ranges over `(site.GetPage "/services").Pages.ByWeight` and delegates each card to `partials/service-card.html`.
- `layouts/_default/list.html` — `/services/` listing, also ranges `.Pages.ByWeight` through the same `service-card` partial.
- `layouts/_default/single.html` — fallback for generic single pages (about-us uses this).
- `layouts/services/single.html` — service detail with right-side sidebar (`Our Services` nav + 24/7 contact widget). Sidebar list is generated from `(site.GetPage "/services").Pages.ByWeight` with `.active` applied to the current page.
- `layouts/contact/single.html` — contact page is routed here because `content/contact.md` sets `type: "contact"` in front matter.
- `layouts/partials/header.html`, `footer.html` — global nav and footer. Services dropdown (header) and services links (footer) are generated from the services section.
- `layouts/partials/service-card.html` — single source of truth for service-card markup (home grid and `/services/` listing both use it). Reads `.Params.image`, `.Params.icon`, `.Params.summary`, `.Title`, `.RelPermalink`.
- `layouts/shortcodes/asset-image.html` — `{{</* asset-image src="..." alt="..." width="..." */>}}` shortcode for embedding `assets/images/` images inside markdown bodies with Hugo image processing. Errors if `src` doesn't resolve.

### Content model

- `content/_index.md` — home (title only; body is unused, homepage is layout-driven).
- `content/about-us.md`, `content/contact.md` — top-level pages.
- `content/services/_index.md` + `content/services/<slug>.md` — service section.
- Markdown uses **unsafe goldmark** (`hugo.yaml`: `markup.goldmark.renderer.unsafe: true`) — service pages embed raw `<div class="service-features-grid">` HTML inside markdown. This is intentional; don't strip it.

**Service front matter contract** (load-bearing for the data-driven nav/cards):

```yaml
title: "Yacht"
image: "yacht.jpg"        # filename under assets/images/services/
icon: "M3 13.5L12 3..."   # SVG path "d" attribute, rendered inside <svg viewBox="0 0 24 24">
description: "..."        # SEO meta description
summary: "..."            # marketing copy used on home/listing cards (overrides Hugo's auto .Summary)
weight: 1                 # sort order across nav, dropdown, footer, sidebar, cards
```

`image` is a filename, not a path — the template prefixes `images/services/`. `icon` is just the path `d` data, not full SVG markup.

### Site params

`hugo.yaml` `params` block exposes `phone`, `email`, `address`, `description`. Templates reference these as `.Site.Params.phone` / `.email`. The `main` menu in `hugo.yaml` is defined but the nav in `layouts/partials/header.html` is hand-written and does **not** iterate the menu — changes to the menu config don't propagate.

### Styling

- `assets/css/main.css` — single hand-written stylesheet, no framework. Brand tokens are CSS custom properties at `:root`: `--navy` `#0a1628`, `--gold` `#c4922a`, fonts `Playfair Display` (serif headings) + `Source Sans 3` (sans body).
- `assets/js/main.js` — vanilla JS for navbar scroll state, mobile menu toggle, dropdown toggle.
- Both pass through `resources.Minify` in `baseof.html` — edit the `assets/` source, not `public/`.

### Images

- All site images live under `assets/images/` (services in `assets/images/services/`). Hugo Pipes transcodes them to webp + fingerprints the output (cache-busting via filename hash).
- Service templates and the home page card use `.Process "webp q85"` (format-only, no resize) so the four service images and one about-us image dedupe to one built artifact each.
- The `asset-image` shortcode is the only way to surface `assets/images/` content from inside a markdown body — direct `<img src="/images/...">` skips the pipeline and breaks if filenames change.
- Source images are currently 600×537 (services) / 960×540 (about-us). Templates do **not** upscale; if you want sharper detail on hi-DPI displays, replace the source with a larger image — templates will pick it up automatically.

### Multilingual scaffolding

`i18n/` and `data/` directories exist but are empty. `hugo.yaml` sets `languageCode: "en-us"` and content is English-only. No translation flow is wired up.

## Adding a new service

One file, one image. Nav/cards/dropdown/sidebar/footer all update automatically.

1. Drop the image into `assets/images/services/<slug>.jpg` (or .png).
2. Create `content/services/<slug>.md` with the front-matter contract above (`title`, `image`, `icon`, `description`, `summary`, `weight`).

The home grid CSS is sized for 4 cards — adding a 5th may need a CSS tweak in `assets/css/main.css` `.services-grid`.

## Gotchas

- `static/images/` exists but is empty — Hugo Pipes (`assets/`) is the canonical image location now.
- `hugo.yaml` `menu.main` is defined but unused; nav is hand-written in `partials/header.html`. Either render `range .Site.Menus.main` or delete the config block to remove the trap.
- `.hugo_build.lock` is a Hugo runtime artifact; leave it alone.
- `public/` is build output; never edit it by hand.
