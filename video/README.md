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
| `.media/audio/voice/voice_001.mp3` | Voiceover take (ElevenLabs "Everett"), every line once |
| `vo.json` | Voiceover cue sheet: where each line sits in the take and in the ad, per hook |
| `KLING_SHOTS.md` | Shot list and prompts for the five Kling films |
| `KLING_SESSION.md` | Runbook for the session that makes the Kling clips and finishes the ad |
| `out/` | Rendered MP4s; `out/audio/` holds each one's soundtrack (M4A) |
| `clip-ad/` | A separate 16 s 9:16 spot built only from the owner's first Kling clip (`npm run clip:check`, `npm run clip:render` → `out/clip-ad/`) |
| `tour-ad/` | A separate 18 s 9:16 room-by-room spot on the site's coastal walkthrough, 2.0–11.9 s (`npm run tour:check`, `npm run tour:render` → `out/tour-ad/`) |

```bash
npm run build        # stage ../assets/video-src/ into media/, regenerate landscape/
npm run check        # strict HyperFrames check: 9:16 (both safe bands) and 16:9
npm run dev          # Studio preview (9:16); npm run dev:16x9 for the 16:9 cut
npm run render:all   # four MP4s into out/ (+ soundtracks in out/audio/), verified H.264 / yuv420p / faststart / < 8 MB
```

Hook variant is a composition variable: `--variables '{"hook":"B"}'` (A, B, C).
Media goes in `../assets/video-src/` (see its README); licences in `../assets/CREDITS.md`.

**Sound.** `scripts/voiceover.mjs [A|B|C]` builds `media/vo.wav` from the take
and `vo.json` (the build stages hook A; `render:all` rebuilds it per hook, so
each render speaks the hook it shows). The music carries a HyperFrames
voiceover carve. After changing `vo.json`, rebuild and re-carve:

```bash
npm run voiceover
node <hyperframes-audio skill>/scripts/carve.mjs --comp index.html --bed music --voice voiceover
npm run loop-carve   # starts and ends every carve envelope at the same value, for the loop
```
