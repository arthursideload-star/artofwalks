# Kling 3.0 shot list for the ad

Image-to-video, one clip per slot, from the villa photos (collage of 12 sent on
2026-10-22; positions below count row by row, left to right). Each prompt keeps
the photo as the first frame and asks for one slow, stabilised drone-style move
with nothing added. Generate in the highest quality available (1080p "pro" or
better), no audio (the ad has its own music).

There are no larger originals (the photos are AI-generated and exist only as
the collage, ~350 × 250 px each; all 12 are in `../assets/video-src/collage/`).
So Kling gets the **4× upscales** (Real-ESRGAN x4plus, see `../assets/CREDITS.md`),
already cut into ready start frames in `../assets/video-src/kling/`: one 9:16 and
one 16:9 per film, each a centred crop, because the ad frames every slot with a
centred `object-fit: cover` (so V1 starts exactly where the push into P1 ends,
and V5 matches P2 in the split screen).

## Start frames → output files

| Slot | 9:16 start frame → file | 16:9 start frame → file | Length |
| ---- | ----------------------- | ----------------------- | ------ |
| V1 | `kling/v1-start-9x16.jpg` → `v1-hero-film.mp4` | `kling/v1-start-16x9.jpg` → `v1-hero-film-16x9.mp4` | 5 s |
| V2 | `kling/v2-start-9x16.jpg` → `v2-cut-a.mp4` | `kling/v2-start-16x9.jpg` → `v2-cut-a-16x9.mp4` | 5 s |
| V3 | `kling/v3-start-9x16.jpg` → `v3-cut-b.mp4` | `kling/v3-start-16x9.jpg` → `v3-cut-b-16x9.mp4` | 5 s |
| V4 | `kling/v4-start-9x16.jpg` → `v4-cut-c.mp4` | `kling/v4-start-16x9.jpg` → `v4-cut-c-16x9.mp4` | 5 s |
| V5 | `kling/v5-start-9x16.jpg` → `v5-split-film.mp4` | `kling/v5-start-16x9.jpg` → `v5-split-film-16x9.mp4` | 10 s |

Paths are relative to `../assets/video-src/`; the output files go straight into
that folder. The 9:16 files feed the three vertical ads, the `-16x9` files the
landscape ad (without them it would centre-crop the vertical clips). The output
must keep the start frame's aspect ratio. The ad uses 4.1 s of V1, the first
2 s of V2–V4 and 9.5 s of V5.

| Slot | Photo (collage position) | Length | Camera move | Where it plays |
| ---- | ------------------------ | ------ | ----------- | -------------- |
| P1 | #1 villa on the cliff with infinity pool (row 1, 1st) | photo | — | hook card, loop ending |
| V1 | from #1 | 5 s | slow aerial glide forward and slightly down toward the pool and terrace | "Same photo. 6 seconds later." |
| V2 | #3 living room with sea view (row 1, 3rd) | 5 s | slow dolly forward toward the windows | "No crew." |
| V3 | #4 bedroom with sea view (row 1, 4th) | 5 s | slow lateral glide left → right, revealing the view | "No scheduling." |
| V4 | #6 breakfast terrace under bougainvillea (row 2, 2nd) | 5 s | slow pull-back revealing terrace and sea | "No strangers in your home." |
| P2 | #11 villa at dusk with lit pool (row 3, 3rd) | photo | — | split screen, left |
| V5 | from #11 | 10 s | slow low aerial glide along the pool toward the villa | split screen right, behind the price card |

## Prompt (shared part, prepend to each shot)

> Cinematic real-estate walkthrough filmed like a stabilised drone: one slow,
> continuous, perfectly smooth camera move at constant speed. Keep every object,
> material, colour and the architecture exactly as in the photo. Realistic
> natural light. No people, no animals, no new objects, no text.

## Shot prompts

- **V1**: Slow aerial glide forward and slightly downward from the cliff toward the infinity pool and the villa terrace, the sea on the left, steady altitude.
- **V2**: Slow, steady dolly forward through the living room toward the floor-to-ceiling windows and the sea view, at eye level.
- **V3**: Slow lateral glide from left to right across the bedroom, parallel to the bed, revealing the sea view through the window, at eye level.
- **V4**: Slow pull-back away from the breakfast table under the bougainvillea pergola, revealing more of the terrace and the sea, at eye level.
- **V5**: Slow low aerial glide forward along the illuminated infinity pool toward the villa at dusk, steady altitude.

## Negative prompt (all shots)

> people, person, hands, animals, cars, boats, text, logo, watermark, extra
> furniture, new objects, changed architecture, warping, morphing, melting,
> stretching, flicker, glitch, jitter, camera shake, fast motion, sudden zoom,
> cuts, transitions, distortion, blur, artifacts

## After generation

Save the ten clips under the names in the table above, in `assets/video-src/`
(P1 and P2 are already there; every slot is already flagged `"ai": true`, so the
"AI sample" label follows the films); record source and licence in
`assets/CREDITS.md`; then `npm run check` and `npm run render:all`. The full
step-by-step for a session that does all of this is `KLING_SESSION.md`.
