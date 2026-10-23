# Credits and licences — ArtOfWalks ad (`video/`)

Every asset used in the ad, where it came from, and the licence it is used under.
Add a row whenever a file lands in `assets/video-src/`.

## Footage and photos (`assets/video-src/`)

| Slot | File | Source | Licence / rights | AI-generated? | Status |
| ---- | ---- | ------ | ---------------- | ------------- | ------ |
| P1 | `p1-listing-photo.jpg` | The owner's villa photo #1 (collage row 1, 1st; `collage/tile-01.png`, 352 × 250 px), sent 2026-10-22. Upscaled 4× to 1376 × 968 with Real-ESRGAN (see below); nothing added or removed. | Supplied by the owner, who generated it with an AI image tool and holds no larger file. Generator not named yet: record its name and terms here before publishing. | **Yes**: "AI sample" label on | in the renders |
| V1 | `v1-hero-film.mp4` | — | — | — | **missing** (placeholder renders); Kling shot list in `video/KLING_SHOTS.md` |
| V2 | `v2-cut-a.mp4` | — | — | — | **missing** (placeholder renders) |
| V3 | `v3-cut-b.mp4` | — | — | — | **missing** (placeholder renders) |
| V4 | `v4-cut-c.mp4` | — | — | — | **missing** (placeholder renders) |
| P2 | `p2-split-photo.jpg` | The owner's villa photo #11 (collage row 3, 3rd; `collage/tile-11.png`, 346 × 251 px), sent 2026-10-22. Upscaled 4× to 1352 × 972 with Real-ESRGAN; nothing added or removed. | As P1. | **Yes**: "AI sample" label on | in the renders |
| V5 | `v5-split-film.mp4` | — | — | — | **missing** (placeholder renders) |
| — | `collage/tile-01.png` … `tile-12.png` | The 12 villa photos cut out of the owner's collage (2026-10-22), unchanged. Kept as the source for the Kling clips. | As P1. | **Yes** | not used directly |
| — | `kling/tile-03-x4.jpg`, `tile-04-x4.jpg`, `tile-06-x4.jpg`; `kling/v1…v5-start-9x16.jpg`, `-16x9.jpg` | Photos #3, #4, #6 upscaled 4× with Real-ESRGAN, and the ten Kling start frames: centred 9:16 and 16:9 crops of P1, those three, and P2. Cropped only, nothing added. | As P1. | **Yes** | inputs for the Kling clips, not used by the ad |

**Upscaling.** Real-ESRGAN x4plus (Xintao Wang et al., github.com/xinntao/Real-ESRGAN,
release v0.2.5.0 ncnn model), BSD-3-Clause, run once on CPU with the `ncnn`
Python package (Tencent, BSD-3-Clause). It sharpens and invents fine texture at
4× scale; the composition and content of each photo are unchanged. Neither tool
ships with the project.

The site's own files in `assets/videos/` and `assets/photos/` were deliberately
**not** used: the brief allows only `assets/video-src/`, and their licence is
not on record here.

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

## Voiceover

| Asset | Source | Licence |
| ----- | ------ | ------- |
| `video/.media/audio/voice/voice_001.mp3` (25.5 s, every line in one take) | **AI-generated speech**: ElevenLabs, voice "Everett - Confident American Ads" (voice_id `TdGSaGM0xJze6GHo3qqb`), model `eleven_v4`, generated 2026-10-22 in the owner's connected ElevenLabs workspace (flow `SrGV8R1qmY3KLxzJ9Cq6`, generation `7ijlsGhqjD0DWrDufkiF`). Script = the on-screen copy, numbers spelled out. Cut and placed by `video/vo.json` + `video/scripts/voiceover.mjs`. | ElevenLabs terms of the owner's plan. Commercial use needs a paid plan (Starter or higher); on the free plan the audio may not be used in an ad. Check the plan before publishing. |

## Brand, type, code

| Asset | Source | Licence |
| ----- | ------ | ------- |
| Logo mark (play tile) | `assets/brand/logo.svg`, inlined verbatim in `video/compositions/s6-logo.html` | ArtOfWalks' own mark |
| Inter typeface (400/700/900) | Embedded by the HyperFrames compiler (Google Fonts build) | SIL Open Font License 1.1 |
| Arrow / caret icons | Path data copied from the site's own SVG sprite in `index.html` (Phosphor Icons, Regular) | MIT |
| Film-grain texture | SVG `feTurbulence`, the same technique as the site's `css/styles.css` | Own work |
| GSAP 3.14.2 (`video/vendor/gsap-3.14.2.min.js`) | npm `gsap@3.14.2` | GreenSock Standard "no charge" licence (https://gsap.com/standard-license) |
| HyperFrames CLI 0.8.169 + skills | npm `hyperframes`, github.com/heygen-com/hyperframes | Apache-2.0 |
| `@hyperframes/core` 0.8.169 (dev dependency, used by the voiceover-carve analysis) | npm `@hyperframes/core` | Apache-2.0 |

## On-screen claims (checked against `index.html`, 2026-10-17, re-checked 2026-10-22)

- "From €50" = Single Clip €50. "Full Walkthrough €749" = the Full Walkthrough
  card price. That card still carries a "Summer Sale −25%" badge and a struck
  €999, while the sale banner's end date (2026-09-15) has passed; if the price
  goes back to €999, change `PRICE_FULL_WALKTHROUGH` in
  `video/compositions/s45-split-offer.html` and re-render.
- "Delivered in days, not weeks." matches the site's "Ready in Days, Not Weeks".
- No guarantee, testimonial, rating, customer logo or competitor price appears,
  on screen or in the voiceover (which only repeats the on-screen copy).
