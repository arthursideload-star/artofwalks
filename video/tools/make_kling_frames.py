#!/usr/bin/env python3
"""Kling start/end frames for the five films. Start and end are two different
photos of the villa (crops of the 4x upscales), so Kling has to move the camera
from one place to the other. Resized to 1080x1920 (9:16) and 1920x1080 (16:9).

Usage: python3 tools/make_kling_frames.py ../assets/video-src ../assets/video-src/kling   (needs opencv-python)
"""
import sys

import cv2

V, OUT = sys.argv[1], sys.argv[2]
# collage photo number -> its 4x upscale
SRC = {1: V + "/p1-listing-photo.jpg", 2: V + "/p2-split-photo.jpg", 3: V + "/kling/tile-03-x4.jpg",
       5: V + "/kling/tile-05-x4.jpg", 6: V + "/kling/tile-06-x4.jpg", 7: V + "/kling/tile-07-x4.jpg",
       10: V + "/kling/tile-10-x4.jpg", 11: V + "/kling/tile-11-x4.jpg"}
# slot -> format -> (start, end), each (photo, (x, y, w, h)) in that photo's upscale
CLIPS = {
    # from the cliff down onto the pool deck; starts where the push into P1 ends
    "v1": {"9x16": [(1, (416, 0, 544, 968)), (2, (488, 0, 544, 968))],
           "16x9": [(1, (0, 97, 1376, 774)), (2, (0, 104, 1352, 760))]},
    # from the kitchen into the living room
    "v2": {"9x16": [(5, (809, 0, 567, 1008)), (3, (268, 0, 544, 968))],
           "16x9": [(5, (0, 117, 1376, 774)), (3, (0, 104, 1352, 760))]},
    # from the living room out to the breakfast table under the pergola
    "v3": {"9x16": [(3, (808, 0, 544, 968)), (6, (392, 0, 567, 1008))],
           "16x9": [(3, (0, 104, 1352, 760)), (6, (0, 124, 1352, 760))]},
    # through the bathroom to the stone tub at the window
    "v4": {"9x16": [(7, (640, 0, 567, 1008)), (10, (520, 0, 546, 972))],
           "16x9": [(7, (0, 124, 1352, 760)), (10, (0, 106, 1352, 760))]},
    # day turns to dusk on the pool deck; starts on P2 as the split screen frames it
    "v5": {"9x16": [(2, (404, 0, 544, 968)), (11, (403, 0, 546, 972))],
           "16x9": [(2, (0, 104, 1352, 760)), (11, (0, 106, 1352, 760))]},
}
SIZE = {"9x16": (1080, 1920), "16x9": (1920, 1080)}
images = {k: cv2.imread(p) for k, p in SRC.items()}
for slot, fmts in CLIPS.items():
    for fmt, pair in fmts.items():
        for tag, (photo, (x, y, w, h)) in zip(("start", "end"), pair):
            im = images[photo]
            H, W = im.shape[:2]
            assert 0 <= x and 0 <= y and x + w <= W and y + h <= H, (slot, fmt, tag, W, H)
            out = cv2.resize(im[y:y + h, x:x + w], SIZE[fmt], interpolation=cv2.INTER_LANCZOS4)
            cv2.imwrite(f"{OUT}/{slot}-{fmt}-{tag}.jpg", out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    print(slot, "ok")
