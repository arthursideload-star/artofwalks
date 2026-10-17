---
workflow: general-video
flow: automation
storyboard: no
message: "The photos already on your Airbnb listing can become a cinematic walkthrough video."
destination: reels-tiktok-shorts
aspect: 1080x1920
language: en
audience: Airbnb hosts
length: 24s
angle: the ad is the product demo
narration: no
---

## Intent

A premium motion-graphics ad for ArtOfWalks (artofwalks.com). The ad is itself
the product demo: a flat listing photo, shown as a framed card, comes alive.
Stop the scroll in 1.5 s, make people watch to the end, send them to
artofwalks.com. Premium, calm, confident. No stock-template look, no generic
gradients.

Routing: the user asked for `/motion-graphics` with a fallback. Its own contract
sends longer / multi-scene pieces to `/general-video`; this is a 24 s six-scene
ad, so `/general-video` owns it.

Run shape: the user asked for design.md and a storyboard shown in chat, then a
build, check and render without further questions. That is `flow: automation`,
`storyboard: no` (no review pause), derived mode `autonomous`. Rendering was
pre-approved in the request ("build, check and render without asking again").

## Assets

- ../assets/brand/logo.svg — the ArtOfWalks mark; inlined verbatim in the logo
  lockup and the loop morph.
- ../assets/video-src/ — the ONLY permitted source of photos and clips. Empty at
  build time, so every media slot renders a marked placeholder. Slot list:
  `slots.json` and `../assets/video-src/README.md`.

## Customizations

- Three hook variants (A/B/C) selected by the `hook` composition variable.
- Primary 9:16 1080x1920; derived 16:9 1920x1080 generated from the same
  `index.html` (`scripts/derive-landscape.mjs`), not rebuilt.
- Seamless loop: the last frame flows into the first.
- Music: calm modern beat, cuts on beats, loop-safe ending, no attribution
  required.
- Count-up on the price card.
- "AI-generated sample" label in every frame where an AI-generated slot is shown.

## Notes

- No voiceover. Every message burned in as text, readable muted, inside safe
  zones.
- No money-back or guarantee claims, no testimonials, ratings or customer
  logos, no competitor prices.
- Never "3 days"; use "Delivered in days, not weeks".
- Prices exactly as on the site (checked in ../index.html on 2026-10-17): from
  €50 (Single Clip), Full Walkthrough €749.
- Do not modify any website file. Sources in video/, renders in video/out/.
- MP4 H.264, yuv420p, +faststart, each file under 8 MB.
