# ArtOfWalks

Cinematic walkthrough videos for Airbnb listings, made from the photos hosts already have.

Live site: https://arthursideload-star.github.io/artofwalks/

## Updating content

- Videos: replace `assets/videos/video-1..3.mp4` (keep the names). See `assets/videos/README.txt`.
- Before/after photos: add `assets/photos/photo-1..2.jpg` (or `.png`). See `assets/photos/README.txt`.
- Poster thumbnails: `assets/posters/poster-1..3.jpg`, extracted from the videos.
- Texts, prices, labels: edit `index.html`.

Static site, no build step. Push to `main` and GitHub Pages redeploys automatically.

## Custom domain

The plan is to move the site to `artofwalks.com`. The full step-by-step
guide (DNS records, GitHub Pages settings, URL updates, branded email) is
in [`docs/DOMAIN-SETUP.md`](docs/DOMAIN-SETUP.md).

## SEO files

- `sitemap.xml` and `robots.txt` live in the repo root. Their URLs (and the
  canonical/OG tags in `index.html`) must be updated when the custom domain
  goes live — the sed one-liner in `docs/DOMAIN-SETUP.md` does all of it.
- `index.html` contains a hidden, commented-out testimonials section.
  Un-comment it and fill in real customer quotes once you have them.
