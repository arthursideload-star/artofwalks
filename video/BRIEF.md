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
narration: yes  # added 2026-10-22 at the owner's request (ElevenLabs)
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
- ../assets/video-src/ — the ONLY permitted source of photos and clips. Slot
  list: `slots.json` and `../assets/video-src/README.md`. Since 2026-10-22 P1 and
  P2 hold two of the owner's AI-generated villa photos (from the 12-photo collage
  they sent, upscaled 4x); the five film slots still render marked placeholders
  until the Kling clips exist (`KLING_SHOTS.md`).
- .media/audio/voice/voice_001.mp3 — the voiceover take (ElevenLabs), cut by
  `vo.json`.

## Customizations

- Three hook variants (A/B/C) selected by the `hook` composition variable.
- Primary 9:16 1080x1920; derived 16:9 1920x1080 generated from the same
  `index.html` (`scripts/derive-landscape.mjs`), not rebuilt.
- Seamless loop: the last frame flows into the first.
- Music: calm modern beat, cuts on beats, loop-safe ending, no attribution
  required.
- Count-up on the price card.
- A very small "AI sample" label in the bottom-right corner of every frame where
  an AI-generated slot is shown (the owner's wording and position, 2026-10-22;
  earlier builds used "AI-generated sample" top left).
- Voiceover on every line, ElevenLabs voice "Everett - Confident American Ads",
  timed to the on-screen copy; the music is carved around it.

## Notes

- Voiceover added 2026-10-22 (the original brief said none; the owner asked for
  an ElevenLabs voice). Every message is still burned in as text, readable
  muted, inside safe zones; the voice repeats the on-screen copy and adds no
  claim of its own.
- No money-back or guarantee claims, no testimonials, ratings or customer
  logos, no competitor prices.
- Never "3 days"; use "Delivered in days, not weeks".
- Prices exactly as on the site (checked in ../index.html on 2026-10-17 and
  again on 2026-10-22): from €50 (Single Clip), Full Walkthrough €749.
- Do not modify any website file. Sources in video/, renders in video/out/.
- MP4 H.264, yuv420p, +faststart, each file under 8 MB.
