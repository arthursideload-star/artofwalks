# ArtOfWalks

Cinematic walkthrough videos for Airbnb listings, made from the photos hosts already have.

Live site: https://artofwalks.com/

## Before you take the first payment

See **[SETUP.md](SETUP.md)** — the four Stripe payment links are still
placeholders, and the VAT line needs confirming.

## Pages

| File          | What it is                                    |
| ------------- | --------------------------------------------- |
| `index.html`  | the landing page                              |
| `thanks.html` | order confirmation, Stripe's success URL      |
| `terms.html`  | terms and conditions + right of withdrawal    |
| `legal.html`  | legal notice (Impressum) + privacy policy     |

## Updating content

- Videos: `assets/videos/video-3.mp4` is the only showcase video (AI-generated sample). See `assets/videos/README.txt`.
- Poster thumbnail: `assets/posters/poster-3.jpg`, extracted from the video.
- Texts, prices, labels: edit `index.html`.

Static site, no build step. Push to `main` and GitHub Pages redeploys automatically.
