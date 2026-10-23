#!/usr/bin/env node
// Stage everything the 16 s clip ad needs into clip-ad/media/ and clip-ad/vendor/:
//   media/clip.mp4      the owner's Kling clip, H.264 24 fps, a keyframe every second, no audio
//   media/clip-rev.mp4  the same clip reversed (plays behind the price)
//   media/still.jpg     its first frame (the "listing photo" before it comes alive)
//   media/music.wav     the first 16 s (8 bars) of the ad's music bed, faded out at the end
//   media/vo.wav        the voiceover, cut from the ElevenLabs take by vo.json
//
// Usage: node clip-ad/build.mjs   (from video/, needs ffmpeg)

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stageVoiceover } from "../scripts/voiceover.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CLIP = join(ROOT, "..", "assets", "video-src", "clips", "kling-01-pool-drone-16x9.mp4");
const MEDIA = join(HERE, "media");
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });

mkdirSync(MEDIA, { recursive: true });
mkdirSync(join(HERE, "vendor"), { recursive: true });
copyFileSync(join(ROOT, "vendor", "gsap-3.14.2.min.js"), join(HERE, "vendor", "gsap-3.14.2.min.js"));

// HyperFrames seeks every frame: a keyframe each second keeps the seeks exact
const enc = ["-an", "-r", "24", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-g", "24", "-keyint_min", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
ff(["-i", CLIP, ...enc, join(MEDIA, "clip.mp4")]);
ff(["-i", join(MEDIA, "clip.mp4"), "-vf", "reverse", ...enc, join(MEDIA, "clip-rev.mp4")]);
ff(["-i", join(MEDIA, "clip.mp4"), "-frames:v", "1", "-q:v", "2", join(MEDIA, "still.jpg")]);
ff(["-i", join(ROOT, ".media", "audio", "bgm", "bgm_001.wav"), "-t", "16", "-af", "afade=t=out:st=15.2:d=0.8", "-c:a", "pcm_s16le", join(MEDIA, "music.wav")]);
const hook = stageVoiceover("A", { cues: join(HERE, "vo.json"), dest: join(MEDIA, "vo.wav") });
console.log(`clip-ad staged: clip, reverse, still, music (16 s), voiceover ("${hook}" + body)`);
