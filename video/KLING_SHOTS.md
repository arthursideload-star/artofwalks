# Kling shot list for the ad

Five films, each made twice (9:16 for the three vertical ads, 16:9 for the
landscape ad) with Kling's **start & end frame** image-to-video mode, so the
camera move is pinned at both ends: one slow, stabilised move, nothing added.
Highest quality (Kling 3.0, 1080p / professional; if 3.0 offers no end frame,
the newest Kling model that does), no audio.

The photos are AI-generated and exist only as the owner's collage
(~350 × 250 px each, all 12 in `../assets/video-src/collage/`), so every frame
is a crop of a 4× upscale (Real-ESRGAN x4plus, see `../assets/CREDITS.md`),
resized to 1080 × 1920 or 1920 × 1080. V1 starts exactly where the push into P1
ends, and V5 starts on P2 as the split screen frames it (the ad shows every slot
with a centred `object-fit: cover`).

## Frames → output files

All paths under `../assets/video-src/`; frames in `kling/`, outputs next to the photos.

| Slot | Photo | Move | Length | 9:16 frames → file | 16:9 frames → file |
| ---- | ----- | ---- | ------ | ------------------ | ------------------ |
| V1 | #1 villa on the cliff (P1) | glide forward and down to the pool | 5 s | `v1-9x16-start/end.jpg` → `v1-hero-film.mp4` | `v1-16x9-start/end.jpg` → `v1-hero-film-16x9.mp4` |
| V2 | #3 living room | dolly forward to the windows | 5 s | `v2-9x16-start/end.jpg` → `v2-cut-a.mp4` | `v2-16x9-start/end.jpg` → `v2-cut-a-16x9.mp4` |
| V3 | #4 bedroom | lateral glide right → left, ending on the window | 5 s | `v3-9x16-start/end.jpg` → `v3-cut-b.mp4` | `v3-16x9-start/end.jpg` → `v3-cut-b-16x9.mp4` |
| V4 | #6 breakfast terrace | pull back from the table | 5 s | `v4-9x16-start/end.jpg` → `v4-cut-c.mp4` | `v4-16x9-start/end.jpg` → `v4-cut-c-16x9.mp4` |
| V5 | #11 villa at dusk (P2) | low glide along the pool to the villa | 10 s | `v5-9x16-start/end.jpg` → `v5-split-film.mp4` | `v5-16x9-start/end.jpg` → `v5-split-film-16x9.mp4` |

Where they play: V1 under "Same photo. 6 seconds later." (4.1 s used), V2–V4
under the three "No …" cuts (2 s each), V5 in the split screen and behind the
price card (9.5 s). The crop rectangles live in `tools/make_kling_frames.py`.

## Prompts (one per clip, the same for both formats)

- **V1**: Smooth cinematic drone shot. The camera glides slowly forward and slightly down from the cliff toward the infinity pool and the villa terrace, in one continuous move at constant speed, from the first frame to the last frame. Stabilized, no shake. Keep the villa, pool, rocks, plants, sea and light exactly as in the images. No people, no new objects, no text.
- **V2**: Smooth cinematic gimbal shot at eye level. The camera dollies slowly forward through the living room toward the floor-to-ceiling windows and the sea view, in one continuous move at constant speed, from the first frame to the last frame. Keep the furniture, materials, colors and light exactly as in the images. No people, no new objects, no text.
- **V3**: Smooth cinematic gimbal shot at eye level. The camera glides slowly sideways from right to left across the bedroom, parallel to the bed, ending on the large window with the sea view, in one continuous move at constant speed, from the first frame to the last frame. Keep the bed, curtains, lamps, materials and light exactly as in the images. No people, no new objects, no text.
- **V4**: Smooth cinematic gimbal shot at eye level. The camera pulls back slowly from the breakfast table under the bougainvillea pergola, revealing more of the terrace, the pool and the sea, in one continuous move at constant speed, from the first frame to the last frame. Keep the food, table, flowers, pool and light exactly as in the images. No people, no new objects, no text.
- **V5**: Smooth cinematic drone shot at dusk. The camera glides slowly forward, low over the illuminated infinity pool, toward the villa with its warm lit windows, in one continuous move at constant speed, from the first frame to the last frame. Stabilized, no shake. Keep the villa, pool lights, loungers, sea and sky exactly as in the images. No people, no new objects, no text.

## Negative prompt (all clips, where the app has the field)

> people, hands, animals, cars, boats, text, logo, watermark, new objects, extra
> furniture, changed architecture, warping, morphing, flicker, glitch, jitter,
> camera shake, fast motion, sudden zoom, cuts, distortion, blur

## After generation

Save the clips under the names in the table, in `assets/video-src/` (P1 and P2
are already there; every slot is flagged `"ai": true`, so the "AI sample" label
follows the films); record source and licence in `assets/CREDITS.md`; then
`npm run check` and `npm run render:all`. For V2–V4 pick the liveliest 2 s of
each clip with `data-media-start` in `compositions/s3-cuts.html` if the first
2 s barely move. A session with API access can do the whole round from
`KLING_SESSION.md`.
