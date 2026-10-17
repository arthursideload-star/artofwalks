#!/usr/bin/env python3
"""Generate the marked placeholder media for every slot in slots.json.

Each slot gets a plate in the ad's palette: a one-point-perspective line drawing
of a room (so the composition's camera moves still read as space), a repeated
"PLACEHOLDER · <slot>" watermark that survives any crop, and a label block with
the exact file to add. Photo slots become 3:2 JPEGs; film slots become short
H.264 clips with a slow camera move, in 9:16 and 16:9. The first frame of a film
matches its photo (p1/v1 share room A, p2/v5 share room B), like the real pairs.

Output: media/placeholders/  (committed, so the project previews without Python)
Usage:  python3 tools/make_placeholders.py   (needs Pillow, ffmpeg, Inter fonts)
"""
import json
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "media", "placeholders")
FONT_DIR = "/usr/share/fonts/opentype/inter"

SURFACE = (20, 27, 45)          # #141B2D
LINE = (148, 163, 184)          # #94A3B8
INK = (255, 255, 255)
INK_SOFT = (203, 213, 225)      # #CBD5E1
ACCENT = (232, 113, 26)         # #E8711A
BG = (10, 10, 10)               # #0A0A0A
MW, MH = 3600, 2400             # master plate, 3:2
FPS = 30

ROOMS = {  # vanishing point offset (fraction), back-wall size, window, door side
    "A": dict(vp=(0.0, -0.02), wall=(0.36, 0.38), windows=1, door="left", sofa=True),
    "B": dict(vp=(-0.06, 0.0), wall=(0.30, 0.34), windows=2, door="right", sofa=True),
    "C": dict(vp=(0.08, -0.04), wall=(0.26, 0.30), windows=1, door="right", sofa=False),
    "D": dict(vp=(-0.10, 0.02), wall=(0.40, 0.36), windows=3, door="left", sofa=False),
    "E": dict(vp=(0.03, 0.03), wall=(0.33, 0.30), windows=2, door=None, sofa=True),
}
SLOT_ROOM = {"p1": "A", "v1": "A", "p2": "B", "v5": "B", "v2": "C", "v3": "D", "v4": "E"}
SLOT_TITLE = {
    "p1": "Listing photo", "v1": "Hero film (made from P1)", "v2": "Film clip A",
    "v3": "Film clip B", "v4": "Film clip C", "p2": "Split photo", "v5": "Split film (made from P2)",
}
# camera per film: (zoom0, zoom1, x0, x1) — x is a fraction of master width
MOVES = {
    "v1": (1.0, 1.24, 0.0, 0.0, 6.0),
    "v2": (1.06, 1.2, -0.03, 0.03, 3.0),
    "v3": (1.16, 1.16, 0.05, -0.05, 3.0),
    "v4": (1.3, 1.06, 0.0, 0.0, 3.0),
    "v5": (1.0, 1.18, 0.0, 0.0, 10.0),
}


def font(weight, size):
    name = {"regular": "Inter-Regular.otf", "bold": "Inter-Bold.otf", "black": "Inter-Black.otf"}[weight]
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def lerp(a, b, k):
    return a + (b - a) * k


def draw_room(spec):
    img = Image.new("RGB", (MW, MH), SURFACE)
    d = ImageDraw.Draw(img, "RGBA")
    vx = MW / 2 + spec["vp"][0] * MW
    vy = MH / 2 + spec["vp"][1] * MH
    ww, wh = spec["wall"][0] * MW, spec["wall"][1] * MH * 1.5
    bl, bt, br, bb = vx - ww / 2, vy - wh / 2, vx + ww / 2, vy + wh / 2
    col = LINE + (120,)
    w = 5
    # room edges
    for (cx, cy), (px, py) in [((0, 0), (bl, bt)), ((MW, 0), (br, bt)), ((0, MH), (bl, bb)), ((MW, MH), (br, bb))]:
        d.line([(cx, cy), (px, py)], fill=col, width=w)
    d.rectangle([bl, bt, br, bb], outline=col, width=w)
    # floor boards converging on the vanishing point
    for i in range(1, 12):
        x = i * MW / 12
        k = (bb - vy) / (MH - vy)
        d.line([(x, MH), (lerp(vx, x, k), bb)], fill=LINE + (50,), width=3)
    # depth lines on the floor
    for j in range(1, 6):
        k = (j / 6) ** 1.8
        y = lerp(bb, MH, k)
        xl = lerp(bl, 0, k)
        xr = lerp(br, MW, k)
        d.line([(xl, y), (xr, y)], fill=LINE + (45,), width=3)
    # windows on the back wall, faint warm light
    n = spec["windows"]
    gw = ww / (n * 1.6 + 0.6)
    for i in range(n):
        x0 = bl + gw * 0.6 + i * gw * 1.6
        y0 = bt + wh * 0.18
        x1, y1 = x0 + gw, y0 + wh * 0.5
        d.rectangle([x0, y0, x1, y1], fill=ACCENT + (26,), outline=col, width=w)
        d.line([((x0 + x1) / 2, y0), ((x0 + x1) / 2, y1)], fill=col, width=3)
        d.line([(x0, (y0 + y1) / 2), (x1, (y0 + y1) / 2)], fill=col, width=3)
        # light spill on the floor
        k0, k1 = 0.15, 0.55
        d.polygon([(x0, bb), (x1, bb), (lerp(vx, x1, 1 + k1), lerp(vy, bb, 1 + k1)), (lerp(vx, x0, 1 + k0), lerp(vy, bb, 1 + k0))], fill=ACCENT + (12,))
    # door on a side wall
    if spec["door"]:
        side = -1 if spec["door"] == "left" else 1
        ex = 0 if side < 0 else MW
        bx = bl if side < 0 else br
        k0, k1 = 0.35, 0.6
        x0, x1 = lerp(bx, ex, k0), lerp(bx, ex, k1)
        ytop0, ytop1 = lerp(bt + wh * 0.3, 0 + MH * 0.12, k0), lerp(bt + wh * 0.3, MH * 0.12, k1)
        ybot0, ybot1 = lerp(bb, MH, k0), lerp(bb, MH, k1)
        d.polygon([(x0, ytop0), (x1, ytop1), (x1, ybot1), (x0, ybot0)], outline=col, width=w)
    # low sofa against the back wall
    if spec["sofa"]:
        sx0, sx1 = vx - ww * 0.32, vx + ww * 0.32
        sy1 = bb + wh * 0.08
        d.rectangle([sx0, sy1 - wh * 0.16, sx1, sy1], outline=col, width=w)
        d.rectangle([sx0, sy1 - wh * 0.28, sx1, sy1 - wh * 0.16], outline=LINE + (80,), width=3)
    # pendant lamp
    d.line([(vx, 0), (vx, bt - wh * 0.15)], fill=LINE + (70,), width=3)
    r = ww * 0.05
    d.ellipse([vx - r, bt - wh * 0.15, vx + r, bt - wh * 0.15 + r * 1.2], outline=col, width=w)
    return img, (vx, vy)


def overlay(size, slot, file_name, kind, anchor="center"):
    """Static RGBA overlay: watermark tiles + label block, drawn at output size.

    anchor puts the label in one half of the frame, so each side of the split
    screen (p2 | v5) keeps its own label readable."""
    W, H = size
    ov = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    s = min(W, H) / 1080
    tile = f"PLACEHOLDER · {slot.upper()}"
    tf = font("bold", int(30 * s))
    step_x, step_y = int(520 * s), int(220 * s)
    for row, y in enumerate(range(int(60 * s), H, step_y)):
        for x in range(-int(260 * s) + (row % 2) * step_x // 2, W, step_x):
            d.text((x, y), tile, font=tf, fill=INK + (34,))
    # label block
    title = SLOT_TITLE[slot] if anchor == "center" else SLOT_TITLE[slot].split(" (")[0]
    ff = font("bold", int(34 * s))
    tf2 = font("black", int(58 * s))
    pf = font("regular", int(32 * s))
    chip = f"PLACEHOLDER · {slot.upper()}"
    lines = [("add  assets/video-src/" + file_name) if anchor == "center" else ("add  " + file_name)]
    bh = int(300 * s)
    if anchor == "center":
        bw = int(min(W - 120 * s, 940 * s))
        bx = (W - bw) // 2
    else:
        bw = int(W / 2 - 80 * s)
        bx = int(40 * s) if anchor == "left" else int(W / 2 + 40 * s)
    # portrait: upper third (clear of the chips at y 250-390 and the copy below y 1180);
    # landscape: mid-height (clear of the chips at y 90-220 and the copy above the bottom 140 px)
    by = int(H * (0.30 if H > W else 0.47)) - bh // 2
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=int(28 * s), fill=BG + (200,), outline=ACCENT + (255,), width=max(2, int(3 * s)))
    pad = int(40 * s)
    d.text((bx + pad, by + pad), chip, font=ff, fill=ACCENT + (255,), spacing=0)
    d.text((bx + pad, by + pad + int(56 * s)), title, font=tf2, fill=INK + (255,))
    d.text((bx + pad, by + pad + int(150 * s)), lines[0], font=pf, fill=INK_SOFT + (255,))
    note = ("film placeholder · replace with your clip" if kind == "film" else "photo placeholder · replace with your photo") if anchor == "center" else ("replace with your clip" if kind == "film" else "replace with your photo")
    d.text((bx + pad, by + pad + int(196 * s)), note, font=pf, fill=LINE + (255,))
    return ov


def crop_at(master, vp, out_size, zoom, xoff):
    W, H = out_size
    a = W / H
    ch = min(MH, MW / a) / zoom
    cw = ch * a
    cx = min(max(vp[0] + xoff * MW, cw / 2), MW - cw / 2)
    cy = min(max(vp[1], ch / 2), MH - ch / 2)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return master.resize(out_size, Image.BICUBIC, box=box)


def ease(k):
    return 0.5 - 0.5 * math.cos(math.pi * k)


def make_photo(slot, file_name):
    """p1 sits in the 3:2 card; p2 is shown full-bleed, so it gets one plate per format."""
    master, vp = draw_room(ROOMS[SLOT_ROOM[slot]])
    if slot == "p1":
        plates = [((1800, 1200), "", master.resize((1800, 1200), Image.LANCZOS))]
    else:
        plates = [(size, sfx, crop_at(master, vp, size, 1.0, 0.0)) for size, sfx in (((1080, 1920), ""), ((1920, 1080), "-16x9"))]
    paths = []
    for size, sfx, img in plates:
        img = img.convert("RGBA")
        img.alpha_composite(overlay(size, slot, file_name, "photo", "left" if slot == "p2" else "center"))
        path = os.path.join(OUT, f"{slot}{sfx}.jpg")
        img.convert("RGB").save(path, quality=90)
        paths.append(path)
    return ", ".join(paths)


def make_film(slot, file_name, out_size, suffix):
    master, vp = draw_room(ROOMS[SLOT_ROOM[slot]])
    z0, z1, x0, x1, dur = MOVES[slot]
    ov = overlay(out_size, slot, file_name, "film", "right" if slot == "v5" else "center")
    path = os.path.join(OUT, f"{slot}{suffix}.mp4")
    W, H = out_size
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-g", str(FPS), "-keyint_min", str(FPS),
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    frames = int(dur * FPS)
    for i in range(frames):
        k = ease(i / max(frames - 1, 1))
        fr = crop_at(master, vp, out_size, lerp(z0, z1, k), lerp(x0, x1, k)).convert("RGBA")
        fr.alpha_composite(ov)
        p.stdin.write(fr.convert("RGB").tobytes())
    p.stdin.close()
    if p.wait() != 0:
        sys.exit(f"ffmpeg failed for {path}")
    return path


def main():
    os.makedirs(OUT, exist_ok=True)
    slots = json.load(open(os.path.join(ROOT, "slots.json")))["slots"]
    only = set(sys.argv[1:])
    for s in slots:
        if only and s["id"] not in only:
            continue
        if s["kind"] == "photo":
            print(make_photo(s["id"], s["file"]))
        else:
            print(make_film(s["id"], s["file"], (1080, 1920), ""))
            print(make_film(s["id"], s["file"], (1920, 1080), "-16x9"))


if __name__ == "__main__":
    main()
