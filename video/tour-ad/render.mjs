#!/usr/bin/env node
// Render the 18 s tour ad (9:16) to out/tour-ad/ and verify it: H.264, yuv420p,
// audio, 18 s, under 8 MB, +faststart. Renders at 24 fps, the walkthrough's real rate,
// so no frame is repeated. Also writes the soundtrack as an .m4a beside it.
//
// Usage: node tour-ad/render.mjs   (from video/; runs build.mjs first)

import { execFileSync } from "node:child_process";
import { closeSync, mkdirSync, openSync, readSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT = join(ROOT, "out", "tour-ad");
const NAME = "artofwalks-tour-ad-9x16";
const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit", cwd: ROOT });

mkdirSync(OUT, { recursive: true });
run("node", [join(HERE, "build.mjs")]);
const raw = join(ROOT, ".hyperframes", `${NAME}.raw.mp4`);
run("npx", ["--yes", "hyperframes@0.8.169", "render", "tour-ad", "--fps", "24", "--video-bitrate", "2400k", "--output", raw]);
const final = join(OUT, `${NAME}.mp4`);
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-c", "copy", "-movflags", "+faststart", final + ".part.mp4"]);
renameSync(final + ".part.mp4", final);
rmSync(raw, { force: true });
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", final, "-vn", "-c:a", "copy", "-movflags", "+faststart", join(OUT, `${NAME}.m4a`)]);

const p = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,pix_fmt,width,height,r_frame_rate", "-of", "json", final]).toString());
const v = p.streams.find((s) => s.codec_type === "video");
const a = p.streams.find((s) => s.codec_type === "audio");
// +faststart = the moov box comes before mdat; walk the top-level boxes
const moovFirst = (() => {
  const fd = openSync(final, "r");
  const size = statSync(final).size;
  const head = Buffer.alloc(16);
  try {
    for (let pos = 0; pos + 8 <= size; ) {
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
})();
const report = {
  file: `out/tour-ad/${NAME}.mp4`,
  size: `${(statSync(final).size / 1e6).toFixed(2)} MB`,
  dims: `${v?.width}x${v?.height}@${v?.r_frame_rate}`,
  duration: Number(p.format.duration).toFixed(3),
  h264: v?.codec_name === "h264",
  yuv420p: v?.pix_fmt === "yuv420p",
  audio: a?.codec_name === "aac",
  is18s: Math.abs(Number(p.format.duration) - 18) < 0.1,
  under8MB: statSync(final).size < 8e6,
  faststart: moovFirst,
};
console.table([report]);
if (!(report.h264 && report.yuv420p && report.audio && report.is18s && report.under8MB && report.faststart)) {
  console.error("tour-ad: the render failed verification");
  process.exit(1);
}
