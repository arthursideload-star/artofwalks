YOUR 3 WALKTHROUGH VIDEOS LIVE IN THIS FOLDER
==============================================

Current mapping (already set up):

  video-1.mp4  -> Santorini caldera drone film (landscape)
                  Hero slide 1 + portfolio "Caldera Villas" + Before/After
  video-2.mp4  -> Iceland panorama cabin (vertical / Reels format)
                  Portfolio tall card "Panorama Cabin"
  video-3.mp4  -> Bright Cycladic interior (landscape)
                  Hero slide 2 + portfolio "Cycladic Suite"

To swap a video: replace the file, keep the name. No code changes needed.
To change titles/locations: edit the <figcaption> lines in index.html,
section "3 - PORTFOLIO".

The thumbnails in assets/posters/poster-1..3.jpg were extracted from
your videos automatically. If you replace a video, replace its poster
too (any frame exported as JPG works, roughly 1280px wide).

Tip: video-1.mp4 is ~39 MB. It only loads when visible, but if mobile
loading ever feels slow, compress it (target under ~15 MB):
  ffmpeg -i video-1.mp4 -vcodec libx264 -crf 26 -preset slow out.mp4
