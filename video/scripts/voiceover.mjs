#!/usr/bin/env node
// Build the voiceover track for one hook variant from the take and vo.json:
// every line is trimmed, given short fades and placed at its cue, then the whole
// track gets a gentle compressor, make-up gain and a peak limiter. Writes
// media/vo.wav (24 s, dual-mono stereo, 48 kHz), and landscape/media/vo.wav when the 16:9
// project exists. <audio id="voiceover"> plays it. Default A; render-all.mjs
// rebuilds it per job.
//
// Usage: node scripts/voiceover.mjs [A|B|C]   (needs ffmpeg 5.1+)

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// `cues` / `dest` let another project (clip-ad/) build its own track from the same take
export function stageVoiceover(hook = "A", { cues: cuesPath = join(ROOT, "vo.json"), dest = join(ROOT, "media", "vo.wav") } = {}) {
  const cues = JSON.parse(readFileSync(cuesPath, "utf8"));
  if (!cues.hooks[hook]) throw new Error(`voiceover: no hook "${hook}" in vo.json`);
  const lines = [...cues.hooks[hook], ...cues.body];
  const len = cues.seconds;
  const n = (v) => Number(v.toFixed(4));
  // a line may name its own take (tour-ad/ mixes two); each take is split once per line it feeds
  const takes = [...new Set(lines.map((l) => l.take ?? cues.take))];
  const split = takes
    .map((take, k) => {
      const outs = lines.map((l, i) => ((l.take ?? cues.take) === take ? `[s${i}]` : "")).join("");
      return `[${k}:a]aresample=48000,asplit=${outs.split("[").length - 1}${outs}`;
    })
    .join(";");
  const parts = lines.map((l, i) => {
    const d = l.out - l.in;
    const ms = Math.round(l.at * 1000);
    return (
      `[s${i}]atrim=start=${n(l.in)}:end=${n(l.out)},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=${cues.fadeIn},afade=t=out:st=${n(d - cues.fadeOut)}:d=${cues.fadeOut},` +
      // adelay keeps the first frame's timestamp, so restamp by sample count before trimming
      `adelay=${ms}|${ms},apad,asetpts=N/SR/TB,atrim=0:${len}[l${i}]`
    );
  });
  // amix divides by its input count; every input spans the whole track, so volume=N restores unity
  const mix =
    `${lines.map((_, i) => `[l${i}]`).join("")}amix=inputs=${lines.length}:duration=longest:dropout_transition=0,volume=${lines.length},` +
    `acompressor=threshold=0.126:ratio=2:attack=10:release=150,volume=${cues.gainDb}dB,` +
    // the limiter's latency compensation drops its lookahead, so pad back to the full length
    `alimiter=limit=0.7079:attack=5:release=60:level=0:latency=1,apad,asetpts=N/SR/TB,atrim=0:${len},` +
    // dual mono: the same level in both channels, so no upmix decides the voice's loudness
    `pan=stereo|c0=c0|c1=c0[out]`;
  execFileSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...takes.flatMap((t) => ["-i", join(ROOT, t)]),
      "-filter_complex", [split, ...parts, mix].join(";"), "-map", "[out]",
      "-ar", "48000", "-c:a", "pcm_s16le", dest],
    { stdio: "inherit" },
  );
  const wide = join(ROOT, "landscape", "media");
  if (dest === join(ROOT, "media", "vo.wav") && existsSync(wide)) copyFileSync(dest, join(wide, "vo.wav"));
  return cues.hooks[hook].map((l) => l.text).join(" ");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hook = (process.argv[2] || "A").toUpperCase();
  console.log(`voiceover ${hook}: "${stageVoiceover(hook)}" + ${JSON.parse(readFileSync(join(ROOT, "vo.json"), "utf8")).body.length} body lines -> media/vo.wav`);
}
