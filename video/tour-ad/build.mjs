#!/usr/bin/env node
// Stage everything the 18 s tour ad needs into tour-ad/media/ and tour-ad/vendor/:
//   media/tour.mp4      the site's coastal walkthrough (assets/videos/video-3.mp4), 2.0–11.93 s:
//                       the living room and the kitchen. The site file is 24 fps footage padded to
//                       30 fps with repeated frames; those are dropped, so this is 24 fps (9.83 s)
//                       with a keyframe every second and no audio
//   media/tour-rev.mp4  its last 3.58 s (86 frames), reversed (plays behind the price)
//   media/music.wav     the first 18 s of the ad's music bed, faded out at the end
//   media/vo.wav        the voiceover, cut from both ElevenLabs takes by vo.json
//
// Usage: node tour-ad/build.mjs   (from video/, needs ffmpeg)

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stageVoiceover } from "../scripts/voiceover.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SITE_VIDEO = join(ROOT, "..", "assets", "videos", "video-3.mp4");
const IN = 2.0; // the cut into the living room
const OUT = 11.933; // the cut out of the kitchen
const MEDIA = join(HERE, "media");
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });

mkdirSync(MEDIA, { recursive: true });
mkdirSync(join(HERE, "vendor"), { recursive: true });
copyFileSync(join(ROOT, "vendor", "gsap-3.14.2.min.js"), join(HERE, "vendor", "gsap-3.14.2.min.js"));

// HyperFrames seeks every frame: a keyframe each second keeps the seeks exact
const enc = ["-an", "-r", "24", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-g", "24", "-keyint_min", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
const dedupe = "mpdecimate=hi=512:lo=256:frac=0.5:max=2,setpts=N/24/TB";
ff(["-i", SITE_VIDEO, "-vf", `trim=start=${IN}:end=${OUT},setpts=PTS-STARTPTS,${dedupe}`, ...enc, join(MEDIA, "tour.mp4")]);
ff(["-sseof", "-3.6", "-i", join(MEDIA, "tour.mp4"), "-vf", "reverse", ...enc, join(MEDIA, "tour-rev.mp4")]);
ff(["-i", join(ROOT, ".media", "audio", "bgm", "bgm_001.wav"), "-t", "18", "-af", "afade=t=out:st=17.2:d=0.8", "-c:a", "pcm_s16le", join(MEDIA, "music.wav")]);
const hook = stageVoiceover("A", { cues: join(HERE, "vo.json"), dest: join(MEDIA, "vo.wav") });
console.log(`tour-ad staged: walkthrough ${IN}–${OUT} s, reversed kitchen, music (18 s), voiceover ("${hook}" + body)`);
