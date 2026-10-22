#!/usr/bin/env node
// Derive the 16:9 project (landscape/) from the 9:16 source — same DOM, same
// timelines, same copy, same audio. HyperFrames allows one root composition per
// project, so the derived version is a sibling project that is never edited by
// hand. Only mechanical substitutions happen:
//   canvas 1080x1920 -> 1920x1080 and data-format portrait -> landscape
//   media/<slot>-16x9.<ext> is copied in as landscape/media/<slot>.<ext>
//   the music, the voiceover take and the staged media/vo.wav are copied as they are
// Every layout difference lives in the source files as [data-format="landscape"]
// CSS and per-format geometry constants.
//
// Usage: node scripts/derive-landscape.mjs   (run from video/ after `npm run media`)

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "landscape");
const BANNER = "<!-- GENERATED from ../ by scripts/derive-landscape.mjs. Do not edit; edit the 9:16 source. -->\n";

function derive(src) {
  const out = src
    .replace(/data-width="1080" data-height="1920"/g, 'data-width="1920" data-height="1080"')
    .replace(/(\n\s*)data-width="1080"(\s*)data-height="1920"/g, '$1data-width="1920"$2data-height="1080"')
    .replace(/data-format="portrait"/g, 'data-format="landscape"')
    .replace('content="width=1080, height=1920"', 'content="width=1920, height=1080"')
    .replace(/width: 1080px;\n(\s*)height: 1920px;/, "width: 1920px;\n$1height: 1080px;")
    .replace("ArtOfWalks ad · 9:16", "ArtOfWalks ad · 16:9")
    .replace(/<!-- SOURCE OF TRUTH\.[^>]*-->\n\s*/, "");
  for (const leftover of ['data-format="portrait"', 'height="1920"', "height: 1920px"]) {
    if (out.includes(leftover)) throw new Error(`derive-landscape: "${leftover}" survived; update the substitutions`);
  }
  return out.replace(/^<!doctype html>\n/i, (m) => m + BANNER);
}

rmSync(OUT, { recursive: true, force: true });
for (const d of ["compositions", "media", "vendor", ".media/audio/bgm", ".media/audio/voice"]) mkdirSync(join(OUT, d), { recursive: true });

writeFileSync(join(OUT, "index.html"), derive(readFileSync(join(ROOT, "index.html"), "utf8")));
const scenes = readdirSync(join(ROOT, "compositions")).filter((f) => f.endsWith(".html"));
for (const f of scenes) {
  writeFileSync(join(OUT, "compositions", f), derive(readFileSync(join(ROOT, "compositions", f), "utf8")));
}

const media = join(ROOT, "media");
if (!existsSync(join(media, "manifest.js"))) throw new Error("run `npm run media` first");
for (const f of readdirSync(media)) {
  const m = f.match(/^(\w+)-16x9\.(jpg|mp4)$/);
  if (m) copyFileSync(join(media, f), join(OUT, "media", `${m[1]}.${m[2]}`));
}
copyFileSync(join(media, "manifest.js"), join(OUT, "media", "manifest.js"));
for (const f of [".media/audio/bgm/bgm_001.wav", ".media/audio/voice/voice_001.mp3", "media/vo.wav"]) copyFileSync(join(ROOT, f), join(OUT, f));
copyFileSync(join(ROOT, "vendor/gsap-3.14.2.min.js"), join(OUT, "vendor/gsap-3.14.2.min.js"));
copyFileSync(join(ROOT, "hyperframes.json"), join(OUT, "hyperframes.json"));
writeFileSync(join(OUT, "meta.json"), JSON.stringify({ id: "video-16x9", name: "ArtOfWalks ad 16:9 (derived)" }, null, 2) + "\n");
writeFileSync(join(OUT, "README.md"), "Generated 16:9 version of the ad. Do not edit: change ../index.html or ../compositions/ and run `npm run derive` in ../\n");
console.log(`derived landscape/ (index.html + compositions/{${scenes.join(", ")}} + media)`);
