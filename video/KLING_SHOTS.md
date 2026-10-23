# Kling shot list for the ad

Five films, each made twice (9:16 for the three vertical ads, 16:9 for the
landscape ad) with Kling's **start & end frame** image-to-video mode. Start and
end are two *different* photos of the villa, so Kling has to fly the camera from
one place to the other: a real walkthrough move, pinned at both ends, nothing
added. Highest quality (Kling 3.0, 1080p / professional; if 3.0 offers no end
frame, the newest Kling model that does), no audio.

The photos are AI-generated and exist only as the owner's collage
(~350 × 250 px each, all 12 in `../assets/video-src/collage/`, numbered row by
row), so every frame is a crop of a 4× upscale (Real-ESRGAN x4plus, see
`../assets/CREDITS.md`), resized to 1080 × 1920 or 1920 × 1080. V1 starts exactly
where the push into P1 ends, and V5 starts on P2 (photo #2) as the split screen
frames it (the ad shows every slot with a centred `object-fit: cover`). The crop
rectangles live in `tools/make_kling_frames.py`.

## Frames → output files

All paths under `../assets/video-src/`; frames in `kling/`, outputs next to the photos.

| Slot | Start → end photo | Move | Length | 9:16 frames → file | 16:9 frames → file |
| ---- | ----------------- | ---- | ------ | ------------------ | ------------------ |
| V1 | #1 villa on the cliff (P1) → #2 pool deck | descend from the cliff onto the pool deck | 5 s | `v1-9x16-start/end.jpg` → `v1-hero-film.mp4` | `v1-16x9-start/end.jpg` → `v1-hero-film-16x9.mp4` |
| V2 | #5 kitchen → #3 living room | walk from the kitchen into the living room | 5 s | `v2-9x16-start/end.jpg` → `v2-cut-a.mp4` | `v2-16x9-start/end.jpg` → `v2-cut-a-16x9.mp4` |
| V3 | #3 living room → #6 breakfast terrace | out through the glass doors to the table under the pergola | 5 s | `v3-9x16-start/end.jpg` → `v3-cut-b.mp4` | `v3-16x9-start/end.jpg` → `v3-cut-b-16x9.mp4` |
| V4 | #7 bathroom → #10 bathroom | through the bathroom to the stone tub at the window | 5 s | `v4-9x16-start/end.jpg` → `v4-cut-c.mp4` | `v4-16x9-start/end.jpg` → `v4-cut-c-16x9.mp4` |
| V5 | #2 pool deck by day (P2) → #11 the same deck at dusk | slow push along the pool while day turns to dusk | 10 s | `v5-9x16-start/end.jpg` → `v5-split-film.mp4` | `v5-16x9-start/end.jpg` → `v5-split-film-16x9.mp4` |

Where they play: V1 under "Same photo. 6 seconds later." (4.1 s used), V2–V4
under the three "No …" cuts (2 s each, so the walkthrough reads kitchen → living
room → terrace → bathroom), V5 in the split screen, photo #2 against its film,
and behind the price card (9.5 s).

## Prompts (one per clip, the same for both formats)

- **V1**: Smooth cinematic drone shot. The camera descends slowly from high above the cliff and glides down onto the wooden pool deck of the villa, ending at deck level beside the sun loungers and the infinity pool, in one continuous move. Stabilized, constant speed, no cuts. Keep the villa, pool, deck, loungers, sea and daylight exactly as in the images. No people, no new objects, no text.
- **V2**: Smooth cinematic gimbal walkthrough at eye level. The camera moves slowly from the kitchen into the bright living room, turning gently toward the sofa, the large windows and the sea view, in one continuous move. Constant speed, no cuts. Keep the furniture, materials, colors and light exactly as in the images. No people, no new objects, no text.
- **V3**: Smooth cinematic gimbal walkthrough at eye level. The camera moves slowly from the living room out through the open glass doors onto the terrace, arriving at the breakfast table under the bougainvillea pergola with the pool and the sea behind it, in one continuous move. Constant speed, no cuts. Keep everything exactly as in the images. No people, no new objects, no text.
- **V4**: Smooth cinematic gimbal walkthrough at eye level. The camera glides slowly through the bright bathroom, past the glass shower, to the freestanding stone bathtub in front of the large window with cacti and the sea, in one continuous move. Constant speed, no cuts. Keep the materials, fixtures and light exactly as in the images. No people, no new objects, no text.
- **V5**: Smooth cinematic time-lapse with a slow camera push. The camera moves slowly forward along the infinity pool toward the villa while day turns into dusk: the sky deepens to blue, the pool lights and the warm window lights switch on. One continuous move, constant speed, no cuts. Keep the villa, pool, deck, loungers and sea exactly as in the images. No people, no new objects, no text.

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
