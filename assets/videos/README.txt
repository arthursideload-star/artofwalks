YOUR 3 SHOWCASE VIDEOS LIVE IN THIS FOLDER
===========================================

Current mapping:

  video-1.mp4  -> Santorini caldera drone film (landscape)
                  Hero slide 1 + portfolio "Caldera Villas" + Before/After
  video-2.mp4  -> Iceland panorama cabin (vertical / Reels format)
                  Portfolio tall card "Panorama Cabin"
  video-3.mp4  -> Coastal property walkthrough (landscape, 1920x1080)
                  Hero slide 2 + portfolio "Spain Coast"

To swap a video: replace the file, keep the name. No code changes needed.
To change titles/locations: edit the <figcaption> lines in index.html,
section "4 - PORTFOLIO".

NONE OF THE THREE HAVE AN AUDIO TRACK. The site therefore does not promise
sound anywhere. The play button still unmutes, so if you ever add music the
copy is the only thing that needs changing back — no code.

IMPORTANT: the Before/After section pairs assets/photos/photo-1.jpg and
photo-2.jpg with video-1.mp4. For that section to make its point, video-1
has to be the video that was actually made from those two photos. If you
swap one, swap the other.

Posters in assets/posters/poster-1..3.jpg are single frames from the videos.
If you replace a video, replace its poster too:

  ffmpeg -i video-3.mp4 -ss 00:00:06 -frames:v 1 -vf scale=1280:-2 -q:v 3 \
    ../posters/poster-3.jpg

Every file here is encoded for the web:

  ffmpeg -i input.mp4 -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p \
    -profile:v high -level 4.0 -an -movflags +faststart output.mp4

-movflags +faststart matters most: it puts the index at the front of the file
so playback starts before the whole thing has downloaded. Without it a visitor
on mobile data stares at a still image.

Current sizes: video-1 6.8 MB, video-2 2.3 MB, video-3 4.7 MB.
