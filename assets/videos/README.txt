YOUR 3 WALKTHROUGH VIDEOS LIVE IN THIS FOLDER
==============================================

Current mapping:

  video-1.mp4  -> Santorini caldera drone film (landscape)
                  Hero slide 1 + portfolio "Caldera Villas" + Before/After
  video-2.mp4  -> Iceland panorama cabin (vertical / Reels format)
                  Portfolio tall card "Panorama Cabin"
  video-3.mp4  -> Bright Cycladic interior (landscape)
                  Hero slide 2 + portfolio "Cycladic Suite"

To swap a video: replace the file, keep the name. No code changes needed.
To change titles/locations: edit the <figcaption> lines in index.html,
section "4 - PORTFOLIO".

IMPORTANT: the Before/After section pairs assets/photos/photo-1.jpg and
photo-2.jpg with video-1.mp4. For that section to make its point, video-1
has to be the video that was actually made from those two photos. If you
swap one, swap the other.

The thumbnails in assets/posters/poster-1..3.jpg were extracted from the
videos. If you replace a video, replace its poster too:

  ffmpeg -i video-1.mp4 -ss 00:00:02 -frames:v 1 -vf scale=1280:-2 \
    ../posters/poster-1.jpg

Current sizes: video-1 10.8 MB, video-2 2.4 MB, video-3 2.6 MB.
video-1 is the heavy one. It only loads when it scrolls into view, but on a
phone on mobile data it is still the slowest thing on the page. Worth getting
under ~5 MB:

  ffmpeg -i video-1.mp4 -vcodec libx264 -crf 28 -preset slow \
    -movflags +faststart -an out.mp4

(-movflags +faststart matters: it moves the index to the front of the file so
playback can start before the whole file has downloaded.)
