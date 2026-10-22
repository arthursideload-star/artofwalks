# Media for the ArtOfWalks ad

The ad in `video/` uses only files from this folder. Until a file is here, its
slot renders a marked placeholder. Use exactly these file names (`.jpg/.png/.webp`
for photos, `.mp4/.mov/.webm` for films are all accepted):

| Slot | File | Where it appears | What it should be |
| ---- | ---- | ---------------- | ----------------- |
| P1 | `p1-listing-photo.jpg` | Hook card 0–2.1 s, loop ending 23.2–24 s | One real listing photo, exactly as on the listing. Landscape 3:2, ≥ 1500 px wide. |
| V1 | `v1-hero-film.mp4` | "Same photo. 6 seconds later." 1.9–6 s | The film made **from P1**, first frame matching the photo. ≥ 5 s. Vertical 9:16 (1080×1920) preferred. |
| V2 | `v2-cut-a.mp4` | "No crew." 6–8 s | Another room or angle, slow camera move, ≥ 2.5 s. Vertical preferred. |
| V3 | `v3-cut-b.mp4` | "No scheduling." 8–10 s | A different space again, ≥ 2.5 s. Vertical preferred. |
| V4 | `v4-cut-c.mp4` | "No strangers in your home." 10–12 s | Ideally a calm wide shot (living room, terrace), ≥ 2.5 s. Vertical preferred. |
| P2 | `p2-split-photo.jpg` | Split screen, left side, 12–16.5 s | A second listing photo whose framing matches V5. May be a copy of P1. |
| V5 | `v5-split-film.mp4` | Split screen right side 12.5–17 s, blurred behind the price card 17–22 s | The film made **from P2**, first frame matching P2, ≥ 10 s (a shorter clip holds its last frame). May be a copy of V1. |

Optional: a `-16x9` version of any file (e.g. `v1-hero-film-16x9.mp4`, 1920×1080)
is used for the 16:9 render instead of a centre crop.

**AI label.** In `video/slots.json` every slot is flagged `"ai": true` (the villa
photos are AI-generated, and the films will be made from them with Kling). Where
a real file sits in an `"ai": true` slot, the ad shows a small "AI sample" label
in the bottom-right corner for as long as that file is on screen. Set the flag
to match how each file was really made.

**What is here now (2026-10-22).** `p1-listing-photo.jpg` and
`p2-split-photo.jpg` are villa photos #1 and #11 from the owner's collage,
upscaled 4× with Real-ESRGAN. `collage/` holds all 12 photos as cut from the
collage (about 350 × 250 px each) for making the films; the ad never reads that
folder. The five films are still missing: see `video/KLING_SHOTS.md`.

**Licences.** Only add files you own or can show a licence for, and record each
one in `assets/CREDITS.md`.

Then, in `video/`:

```bash
npm run render:all   # stages these files, rebuilds the 16:9 version, renders all four MP4s to video/out/
```
