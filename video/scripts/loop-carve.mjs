#!/usr/bin/env node
// Make the voiceover carve on the music loop-safe. The carve (HyperFrames
// hyperframes-audio skill, scripts/carve.mjs) writes its envelopes as if the bed
// started cold: every lane begins at 0 dB and its release runs on past the end of
// the clip. In a 24 s loop the end flows straight back into the start, so each
// lane here starts at the value it has at 24 s and stops there.
//
// Usage: node scripts/loop-carve.mjs   (after carving: node <SKILL_DIR>/scripts/carve.mjs
//        --comp index.html --bed music --voice voiceover)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "index.html");
const html = readFileSync(FILE, "utf8");
const tag = html.match(/<audio id="music"[^>]*>/)?.[0];
const attr = tag?.match(/data-automation="([^"]*)"/);
if (!attr) throw new Error('loop-carve: <audio id="music"> has no data-automation; run the carve first');
const end = Number(tag.match(/data-duration="([\d.]+)"/)[1]);
const auto = JSON.parse(attr[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));

const at = (points, t) => {
  const i = points.findIndex((p) => p.t >= t);
  if (i === -1) return points.at(-1).v;
  if (i === 0) return points[0].v;
  const a = points[i - 1];
  const b = points[i];
  return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t || 1);
};
const r1 = (v) => Math.round(v * 10) / 10;
for (const lane of auto.lanes) {
  const vEnd = r1(at(lane.points, end));
  const kept = lane.points.filter((p) => p.t > 0 && p.t < end);
  lane.points = [{ t: 0, v: vEnd }, ...kept, { t: end, v: vEnd }];
  console.log(`${lane.target.padEnd(11)} wraps at ${vEnd} dB`);
}
const out = JSON.stringify(auto).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
writeFileSync(FILE, html.replace(tag, tag.replace(attr[0], `data-automation="${out}"`)));
