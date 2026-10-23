#!/usr/bin/env python3
"""Kling start/end frames for the five films: crops of the 4x upscaled villa photos,
resized to 1080x1920 (9:16) and 1920x1080 (16:9). Start -> end is the camera move.

Usage: python3 tools/make_kling_frames.py ../assets/video-src ../assets/video-src/kling   (needs opencv-python)
"""
import sys

import cv2

V, OUT = sys.argv[1], sys.argv[2]
SRC = {"v1": V + "/p1-listing-photo.jpg", "v2": V + "/kling/tile-03-x4.jpg", "v3": V + "/kling/tile-04-x4.jpg",
       "v4": V + "/kling/tile-06-x4.jpg", "v5": V + "/p2-split-photo.jpg"}
# (x, y, w, h) in the source; start -> end is the camera move
RECTS = {
    "v1": {"9x16": [(416, 0, 544, 968), (496, 224, 418, 744)],      # glide forward + down to the pool (start = end of the push into P1)
           "16x9": [(0, 97, 1376, 774), (231, 302, 1058, 595)]},
    "v2": {"9x16": [(268, 0, 544, 968), (351, 98, 418, 744)],       # dolly forward to the windows
           "16x9": [(0, 104, 1352, 760), (120, 177, 1040, 585)]},
    "v3": {"9x16": [(640, 0, 544, 968), (290, 0, 544, 968)],        # lateral glide right -> left, ending on the window
           "16x9": [(356, 197, 1020, 574), (0, 197, 1020, 574)]},
    "v4": {"9x16": [(432, 233, 436, 775), (392, 0, 567, 1008)],     # pull back from the breakfast table
           "16x9": [(160, 423, 1040, 585), (0, 124, 1352, 760)]},
    "v5": {"9x16": [(403, 0, 546, 972), (550, 186, 420, 747)],      # glide along the pool to the villa (start = P2 in the split)
           "16x9": [(0, 106, 1352, 760), (280, 227, 1040, 585)]},
}
SIZE = {"9x16": (1080, 1920), "16x9": (1920, 1080)}
for slot, fmts in RECTS.items():
    im = cv2.imread(SRC[slot]); H, W = im.shape[:2]
    for fmt, pair in fmts.items():
        for tag, (x, y, w, h) in zip(("start", "end"), pair):
            assert 0 <= x and 0 <= y and x + w <= W and y + h <= H, (slot, fmt, tag, W, H)
            out = cv2.resize(im[y:y + h, x:x + w], SIZE[fmt], interpolation=cv2.INTER_LANCZOS4)
            cv2.imwrite(f"{OUT}/{slot}-{fmt}-{tag}.jpg", out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    print(slot, "ok")
