# Credits and licences — ArtOfWalks ad (`video/`)

Every asset used in the ad, where it came from, and the licence it is used under.
Add a row whenever a file lands in `assets/video-src/`.

## Footage and photos (`assets/video-src/`)

| Slot | File | Source | Licence / rights | AI-generated? | Status |
| ---- | ---- | ------ | ---------------- | ------------- | ------ |
| P1 | `p1-listing-photo.jpg` | — | — | — | **missing** (placeholder renders) |
| V1 | `v1-hero-film.mp4` | — | — | — | **missing** (placeholder renders) |
| V2 | `v2-cut-a.mp4` | — | — | — | **missing** (placeholder renders) |
| V3 | `v3-cut-b.mp4` | — | — | — | **missing** (placeholder renders) |
| V4 | `v4-cut-c.mp4` | — | — | — | **missing** (placeholder renders) |
| P2 | `p2-split-photo.jpg` | — | — | — | **missing** (placeholder renders) |
| V5 | `v5-split-film.mp4` | — | — | — | **missing** (placeholder renders) |

No third-party, stock or AI-generated footage or photos are in the current
renders. The site's own files in `assets/videos/` and `assets/photos/` were
deliberately **not** used: the brief allows only `assets/video-src/`, and their
licence is not on record here.

## Placeholder plates

| Asset | Source | Licence |
| ----- | ------ | ------- |
| `video/media/placeholders/*` | Generated for this project by `video/tools/make_placeholders.py` (line drawings of a generic room + "PLACEHOLDER" labels, Pillow + FFmpeg). Not AI-generated. | Own work. For drafts only, never for publication. |

## Music

| Asset | Source | Licence |
| ----- | ------ | ------- |
| `video/.media/audio/bgm/bgm_001.wav`, "aow-loop-120bpm" (24.0 s, 120 BPM, loop-safe) | Original composition written as code for this project: `video/tools/make_music.py` (numpy synthesis: pads, FM electric piano, bass, drums, swells; no samples, no ML audio model). The code was written by Claude (an AI assistant) in this session. Registered with HyperFrames `/media-use` via `resolve --from`. | Own work, no third-party rights, no attribution required. |

Why not a library track: the `/media-use` music catalogue (HeyGen) needs a HeyGen
sign-in that this environment does not have, and its offline generator
(MusicGen) ships model weights under CC-BY-NC 4.0, which rules it out for a paid
ad. No sound effects from any library are used.

## Brand, type, code

| Asset | Source | Licence |
| ----- | ------ | ------- |
| Logo mark (play tile) | `assets/brand/logo.svg`, inlined verbatim in `video/compositions/s6-logo.html` | ArtOfWalks' own mark |
| Inter typeface (400/700/900) | Embedded by the HyperFrames compiler (Google Fonts build) | SIL Open Font License 1.1 |
| Arrow / caret icons | Path data copied from the site's own SVG sprite in `index.html` (Phosphor Icons, Regular) | MIT |
| Film-grain texture | SVG `feTurbulence`, the same technique as the site's `css/styles.css` | Own work |
| GSAP 3.14.2 (`video/vendor/gsap-3.14.2.min.js`) | npm `gsap@3.14.2` | GreenSock Standard "no charge" licence (https://gsap.com/standard-license) |
| HyperFrames CLI 0.8.169 + skills | npm `hyperframes`, github.com/heygen-com/hyperframes | Apache-2.0 |

## On-screen claims (checked against `index.html`, 2026-10-17)

- "From €50" = Single Clip €50. "Full Walkthrough €749" = the Full Walkthrough
  card price. That card still carries a "Summer Sale −25%" badge and a struck
  €999, while the sale banner's end date (2026-09-15) has passed; if the price
  goes back to €999, change `PRICE_FULL_WALKTHROUGH` in
  `video/compositions/s45-split-offer.html` and re-render.
- "Delivered in days, not weeks." matches the site's "Ready in Days, Not Weeks".
- No guarantee, testimonial, rating, customer logo or competitor price appears.
