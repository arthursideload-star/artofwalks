# Runbook: make the Kling clips and finish the ad

For a fresh session on branch `claude/loving-galileo-md3da5` of
`arthursideload-star/artofwalks`. Everything except the five films is done: copy,
voiceover, music, photos P1/P2, the "AI sample" label and the render pipeline.
The owner writes in German; answer in German.

## 0 · What you have

- `video/KLING_SHOTS.md`: the shot list, one prompt per clip, the negative
  prompt, and the table of start/end frames → output files.
- `assets/video-src/kling/`: a start and an end frame per clip and format
  (`v1…v5-9x16-start.jpg` / `-end.jpg`, `v1…v5-16x9-start.jpg` / `-end.jpg`),
  crops of the 4× upscaled villa photos.
- The owner's Abacus.AI API key in the environment variable `ABACUS_API_KEY`.
  Never print, log or commit it; pass it only in request headers.

## 1 · Find a working Kling v3 route (stop at the first that works)

1. **Abacus API.** RouteLLM is OpenAI-compatible: base `https://routellm.abacus.ai/v1`,
   header `Authorization: Bearer $ABACUS_API_KEY`. List the models
   (`GET /v1/models`, free) and look for Kling v3 / Kling 3.0 image-to-video.
   Read the current Abacus docs (abacus.ai/help/route-llm/ and its sub-pages,
   studio.abacus.ai) for how a video request is made: endpoint, model id, how the
   start image is passed (URL or data URL), duration, aspect ratio, quality, and
   how to poll and download the result. As of 2026-10-22 the public RouteLLM
   docs describe text and image generation only, and Kling v3 is offered in
   Abacus AI Studio, so check whether video is really reachable before planning.
2. **An Abacus connector** in this session (search your tools for "abacus").
3. **Figma Weave** (`weave_find_model` with "kling 3"): needs the owner's Figma
   account linked to Weave, costs Weave credits, and its tool requires the
   owner's approval of the quoted cost.
4. **Videoslash** (`list_creative_models` for video, `get_credits`): has Kling 3.0
   but needs credits.

If none works, stop and tell the owner exactly what is missing (a blocked host
goes under the environment's allowed domains; a missing connector at
claude.ai/customize/connectors). Never stand in for the films with moving stills
or other footage.

## 2 · Generate the ten clips

- Kling v3, image-to-video with start **and** end frame, highest quality
  (1080p / "pro"), no audio, output in the frames' aspect ratio.
- Prompt = the clip's prompt from `KLING_SHOTS.md`; add the negative prompt and
  the lowest creativity / highest faithfulness setting if the API has them.
- Lengths: V1–V4 5 s, V5 10 s. One 9:16 and one 16:9 clip per slot, ten in all.
  The owner asked for exactly these; generate nothing extra.
- Check every clip before using it: pull frames at 0, 1, 2, 3 s and the last
  frame (`ffmpeg -ss <t> -i clip.mp4 -frames:v 1 f.png`) and look at them. Reject
  a clip with added people, objects or text, warped architecture, flicker,
  jumps or a fast move. Regenerate a rejected clip once; if the second try is
  also flawed, keep the better one and tell the owner.
- Save each clip as delivered, under the names in the table in
  `KLING_SHOTS.md`, straight into `assets/video-src/`. `npm run media`
  normalises them (H.264, 30 fps).

## 3 · Put them in the ad and render

```bash
cd video
npm install            # once per session
npm run check          # must end with "Check passed" three times, 0 errors
npm run render:all     # 4 MP4s into out/ + their soundtracks into out/audio/*.m4a
```

`render:all` prints a table; every column must read `true` (H.264, yuv420p,
audio, 24 s, under 8 MB, faststart). Then look at frames from both formats:

```bash
npx --yes hyperframes@0.8.169 snapshot . --at 2.6,4.5,7,9,11,14,16,19.8 --no-end -o <scratchpad>/snap-9x16
npx --yes hyperframes@0.8.169 snapshot landscape --at 2.6,4.5,7,9,11,14,16,19.8 --no-end -o <scratchpad>/snap-16x9
```

No placeholder plate may be left, the small "AI sample" label must sit
bottom-right whenever a film or photo is on screen, and every caption must stay
readable over the footage.

## 4 · Record, commit, deliver

- Fill rows V1–V5 in `assets/CREDITS.md`: generator and route (e.g. Abacus →
  Kling v3), model id, date, job / generation ids, the terms the output is used
  under, AI-generated: yes, status "in the renders".
- Commit to `claude/loving-galileo-md3da5` and push. No pull request unless the
  owner asks.
- Send the owner the four MP4s and the four `out/audio/*.m4a` soundtracks with
  `SendUserFile` and `display: "attach"` (the in-chat video preview can play
  muted), plus a short German summary: what was generated, any clip that needed
  a retry, what it cost if the API reported it.

## Rules from the brief (unchanged)

- Media only from `assets/video-src/`; never modify the website's own files.
- No guarantee, testimonial, rating, customer-logo or competitor-price claims;
  prices stay "From €50" and "Full Walkthrough €749"; never "3 days".
- Voiceover, music, copy and timing stay as they are.
