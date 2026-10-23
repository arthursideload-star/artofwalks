#!/usr/bin/env node
// Render the four deliverables into out/ and verify each one:
//   artofwalks-ad-9x16-hookA.mp4 / -hookB / -hookC   (index.html, 1080x1920)
//   artofwalks-ad-16x9-hookA.mp4                       (landscape/, 1920x1080)
// plus each one's soundtrack as out/audio/<name>.m4a (the same AAC stream, copied).
// Every file must be H.264, yuv420p, +faststart, 24 s and under 8 MB. HyperFrames
// renders at a capped bitrate; the result is remuxed with +faststart, and
// re-encoded two-pass to a computed bitrate only if it still exceeds the limit.
// Before each job the voiceover for that hook is rebuilt into media/vo.wav (and
// landscape/media/); hook A is restored at the end.
//
// Usage: node scripts/render-all.mjs [A] [B] [C] [16x9]   (run `npm run build` first)

import { execFileSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stageVoiceover } from "./voiceover.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const AUDIO = join(OUT, "audio");
const TMP = join(ROOT, ".hyperframes", "render-tmp");
const LIMIT = 8 * 1000 * 1000; // 8 MB, decimal, with headroom below 8 MiB
const VIDEO_BITRATE = "2200k"; // ~6.6 MB of video in 24 s, leaves room for AAC
const DURATION = 24;

const JOBS = [
  { key: "A", dir: ".", hook: "A", file: "artofwalks-ad-9x16-hookA.mp4" },
  { key: "B", dir: ".", hook: "B", file: "artofwalks-ad-9x16-hookB.mp4" },
  { key: "C", dir: ".", hook: "C", file: "artofwalks-ad-9x16-hookC.mp4" },
  { key: "16x9", dir: "landscape", hook: "A", file: "artofwalks-ad-16x9-hookA.mp4" },
];
const wanted = new Set(process.argv.slice(2));
const jobs = wanted.size ? JOBS.filter((j) => wanted.has(j.key)) : JOBS;

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", cwd: ROOT, ...opts });
const probe = (file) =>
  JSON.parse(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,pix_fmt,width,height", "-of", "json", file]).toString(),
  );
// +faststart = the moov atom precedes mdat; walk the top-level MP4 boxes to check
const faststart = (file) => {
  const fd = openSync(file, "r");
  const size = statSync(file).size;
  const head = Buffer.alloc(16);
  let pos = 0;
  try {
    while (pos + 8 <= size) {
      readSync(fd, head, 0, 16, pos);
      let box = head.readUInt32BE(0);
      const type = head.toString("latin1", 4, 8);
      if (box === 1) box = Number(head.readBigUInt64BE(8));
      if (type === "moov") return true;
      if (type === "mdat" || box < 8) return false;
      pos += box;
    }
    return false;
  } finally {
    closeSync(fd);
  }
};

mkdirSync(AUDIO, { recursive: true });
mkdirSync(TMP, { recursive: true });
for (const job of jobs) {
  const raw = join(TMP, job.file);
  const final = join(OUT, job.file);
  stageVoiceover(job.hook);
  run("npx", [
    "--yes", "hyperframes@0.8.169", "render", job.dir,
    "--variables", JSON.stringify({ hook: job.hook }),
    "--strict-variables",
    "--fps", "30",
    "--video-bitrate", VIDEO_BITRATE,
    "--output", raw,
  ]);
  const tmpFinal = final + ".part.mp4";
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-c", "copy", "-movflags", "+faststart", tmpFinal]);
  if (statSync(tmpFinal).size >= LIMIT) {
    // two-pass to a bitrate that fits, keeping the audio stream as it is
    const audioBits = 160_000 * DURATION;
    const vbr = Math.floor(((LIMIT * 0.97 * 8) - audioBits) / DURATION / 1000) + "k";
    const log = join(TMP, "2pass");
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-c:v", "libx264", "-preset", "slow", "-b:v", vbr, "-pix_fmt", "yuv420p", "-pass", "1", "-passlogfile", log, "-an", "-f", "mp4", "/dev/null"]);
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-c:v", "libx264", "-preset", "slow", "-b:v", vbr, "-pix_fmt", "yuv420p", "-pass", "2", "-passlogfile", log, "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", tmpFinal]);
  }
  renameSync(tmpFinal, final);
  rmSync(raw, { force: true });
  // the soundtrack on its own, bit-identical to the video's audio
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", final, "-vn", "-c:a", "copy", "-movflags", "+faststart", join(AUDIO, job.file.replace(/\.mp4$/, ".m4a"))]);
}
stageVoiceover("A");

// verify every deliverable present in out/, including ones rendered by earlier runs
const report = [];
for (const job of JOBS) {
  const final = join(OUT, job.file);
  if (!existsSync(final)) continue;
  const p = probe(final);
  const v = p.streams.find((s) => s.codec_type === "video");
  const a = p.streams.find((s) => s.codec_type === "audio");
  const size = Number(p.format.size);
  const checks = {
    h264: v?.codec_name === "h264",
    yuv420p: v?.pix_fmt === "yuv420p",
    audio: Boolean(a),
    is24s: Math.abs(Number(p.format.duration) - DURATION) < 0.1,
    under8MB: size < LIMIT,
    faststart: faststart(final),
  };
  report.push({ file: `out/${job.file}`, size: `${(size / 1e6).toFixed(2)} MB`, dims: `${v?.width}x${v?.height}`, duration: Number(p.format.duration).toFixed(3), ...checks });
}
console.table(report);
if (report.some((r) => !(r.h264 && r.yuv420p && r.audio && r.is24s && r.under8MB && r.faststart))) {
  console.error("render-all: a deliverable failed verification");
  process.exit(1);
}
