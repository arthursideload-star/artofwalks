# ArtOfWalks ad (HyperFrames)

24 s motion-graphics ad, 9:16 primary with a derived 16:9 version, built with
HyperFrames 0.8.169 (`/hyperframes` → `/general-video`).

| File | What it is |
| ---- | ---------- |
| `BRIEF.md` | Confirmed brief: message, audience, formats, rules |
| `design.md` | Design spec (brand tokens, safe zones, motion rules) |
| `STORYBOARD.md` | Six frames with timing on the 120 BPM grid |
| `index.html` | Root composition, 9:16 (frame 1, the photo card, loop morph, hook variants) |
| `compositions/` | Scenes 2–6 as sub-compositions |
| `landscape/` | **Generated** 16:9 project; never edit, run `npm run derive` |
| `slots.json` | The seven media slots and their "ai" flags |
| `media/placeholders/` | Marked placeholder plates used until real files exist |
| `.media/audio/bgm/bgm_001.wav` | Original 24 s loop-safe music bed (`tools/make_music.py`) |
| `out/` | Rendered MP4s |

```bash
npm run build        # stage ../assets/video-src/ into media/, regenerate landscape/
npm run check        # strict HyperFrames check: 9:16 (both safe bands) and 16:9
npm run dev          # Studio preview (9:16); npm run dev:16x9 for the 16:9 cut
npm run render:all   # four MP4s into out/, verified H.264 / yuv420p / faststart / < 8 MB
```

Hook variant is a composition variable: `--variables '{"hook":"B"}'` (A, B, C).
Media goes in `../assets/video-src/` (see its README); licences in `../assets/CREDITS.md`.
