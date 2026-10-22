---
name: ArtOfWalks — "The photo comes alive" ad
source: ../index.html + ../css/styles.css (website tokens), brief font override → Inter
colors:
  bg: "#0A0A0A"            # canvas, every scene
  surface: "#141B2D"       # cards, placeholder plates (site --surface)
  ink: "#FFFFFF"           # headlines
  ink-soft: "#CBD5E1"      # secondary copy (site --ink-soft)
  ink-muted: "#94A3B8"     # labels, meta (site --ink-muted)
  accent: "#E8711A"        # the one accent: key word, play mark, CTA, progress
  accent-bright: "#F08A3E" # currency glyph, accent on photos (site --accent-bright)
  sheen: "#FFD9AE"          # light sweep on the price card (site featured-card beam), 10 % alpha
  line: "rgba(148,163,184,0.14)"
  line-strong: "rgba(148,163,184,0.26)"
typography:
  family: Inter            # brief override; site ships Satoshi. Inter 400/700/900 are pre-bundled by HyperFrames.
  display: { weight: 900, tracking: "-0.035em", leading: 1.0 }
  title:   { weight: 900, tracking: "-0.025em", leading: 1.04 }
  label:   { weight: 700, tracking: "0.12em", case: uppercase }   # site .ba-label
  body:    { weight: 400, tracking: "0.01em", leading: 1.4 }
  numerals: tabular-nums
  sizes_9x16: { display: 104, title: 92, kinetic: 116, body: 40, label: 28, price-hero: 260 }
  sizes_16x9: { display: 96, title: 84, kinetic: 108, body: 36, label: 26, price-hero: 220 }
spacing:
  unit: 8
  gutter_9x16: 90
  gutter_16x9: 120
corners:
  card: 32        # site 16px card radius, doubled for a 1080-wide frame
  chip: 999       # pills, like the site's buttons and badges
  logo_tile: "112/512 of tile size"   # from logo.svg
depth: "flat + one soft shadow under the photo card; orange bloom only behind focal objects"
motion:
  house_ease: "expo.out (≈ site cubic-bezier(0.16,1,0.3,1))"
  camera: "power2.inOut / sine.inOut"
  exits: "power3.in, faster than entrances"
  beat: "120 BPM, beat 0.5 s, bar 2.0 s; every cut lands on a beat"
safe_zones:
  "9x16": { left: 90, right: 180, top: 250, bottom: 420 }   # Reels / TikTok / Shorts UI
  "16x9": { left: 120, right: 120, top: 90, bottom: 110 }
---

# ArtOfWalks ad — design spec

## Concept

**The ad is the demo.** One flat listing photo, framed like a print on a dark
wall, is pushed into by a slow film camera until it becomes the film. Copy is set
like film titles: short, heavy, left-aligned, one statement at a time. The
rounded rectangle is the visual thread: photo card → full-bleed film → price
card → logo tile → photo card again, which is what makes the loop seamless.

## Brand, adapted for video

- **Canvas is always #0A0A0A.** No full-screen linear gradients (they band under
  H.264). Atmosphere comes from one localized orange bloom (radial, 18–28 %
  opacity) behind the focal object, a static film grain matching the site's
  `body::after` grain, and a bottom scrim under copy that sits on footage.
- **One accent.** Orange #E8711A marks exactly one thing per frame: the payoff
  word, the "No", the play triangle, the CTA pill, the progress hairline.
  #F08A3E only for the € glyph and for accent text over photographic media.
- **Type.** Inter 900 for everything that must be read muted at a glance;
  Inter 700 uppercase tracked labels (the site's `.ba-label` "Your photos /
  Your video" voice) for UI-like chrome; Inter 400 only for the one support
  line. Tight negative tracking on display sizes, as on the site's hero.
- **Wordmark.** "Art**Of**Walks" in 900 with "Of" in orange, exactly like the
  site nav. The logo tile is `logo.svg` verbatim (#0A0A0A tile, rx 112/512,
  orange play triangle), given a 2 px line-strong ring so it reads on the
  same-colored canvas.
- **Cards.** Surface #141B2D, 2 px line-strong border, 32 px radius, the site's
  featured-card orange edge for the price card.

## Frame rules

- Text lives inside the safe box only (9:16: x 90→900, y 250→1500; 16:9:
  x 120→1800, y 90→970). Nothing readable in the right 180 px or the bottom
  420 px of the vertical frame, where platform buttons and captions sit.
- Minimum sizes, 9:16: statements ≥ 92 px, support ≥ 38 px, labels ≥ 26 px.
  16:9 scales down ~8 %.
- Copy over footage always has the bottom scrim; check contrast ≥ 4.5:1 on the
  scrim's lightest point.
- Left-aligned, edge-anchored copy. Centered only for the price card and the
  logo lockup, where symmetry is the point.
- One visual idea per scene. No decoration that adds a claim.
- The voiceover only repeats the on-screen copy (numbers spelled out), so the ad
  reads the same muted and with sound.

## Motion rules

- Entrances `expo.out` 0.35–0.6 s; exits `power3.in` 0.25–0.35 s; camera moves
  `power2.inOut` / `sine.inOut` 1–4.5 s. The slowest move (scene 2 push-in) is
  over 10× the fastest (the kinetic slams).
- Every hard cut sits on a beat of the 120 BPM grid (0.5 s). The three kinetic
  cuts sit on bar downbeats (6, 8, 10 s).
- Ambient motion is periodic over 24 s (card float 3 s cycles, bloom breathing
  6 s cycles), so the first and last frames match.
- No `Math.random`, no clocks; all motion seekable from one paused GSAP timeline.

## 16:9 derivation

`landscape/` is generated from `index.html` and `compositions/` by
`scripts/derive-landscape.mjs` (HyperFrames allows one root composition per
project, so the 16:9 cut is a sibling project): same DOM, same timelines, same
copy and audio. Only the canvas and the `data-format` switch change;
`[data-format="landscape"]` CSS puts the hook text left of the photo card,
turns the logo lockup horizontal and widens the gutters. Media slots may supply
an optional `-16x9` file; otherwise the same file is center-cropped.

## Placeholders and labels

Until real media exists in `../assets/video-src/`, every slot shows a marked
plate: surface #141B2D, a one-point-perspective line drawing of a room (so the
camera moves still read as space), and the label `PLACEHOLDER · <slot>` with the
exact file name to add. Any slot flagged `"ai": true` in `slots.json` shows the
label **AI sample** in every frame where it is on screen: a deliberately tiny
pill (Inter 600, 20 px, 34 px high) 28 px from the bottom-right corner in both
formats, the owner's wording and position. It sits inside the platform-UI zone
of the 9:16 frame on purpose (`data-layout-allow-caption-zone`); on Reels and
TikTok the app's buttons can cover it, so declare AI content in the upload
settings as well.

## Don'ts

- No guarantee / money-back claims, testimonials, ratings, customer logos,
  competitor prices, "3 days".
- No gradient text, neon, purple-blue gradients, stock-template lower thirds.
- No Airbnb logo or UI imitation: the listing card is generic (photo, pager
  dots, "Photo 1 of 24").
