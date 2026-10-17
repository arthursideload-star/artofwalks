SHOWCASE VIDEO
==============

  video-3.mp4  -> Spain coast sample film (landscape, 1920x1080), AI-generated.
                  Hero + portfolio card. Labelled "AI-generated sample film".

Two earlier showcase videos were removed because their source photos were
not licensed for use. Only add a video here if you own the rights to the
source photos, or the whole film is AI-generated / made from licensed images.

The video has no audio track, so the site does not promise sound anywhere.
The poster is a single frame from the video:

  ffmpeg -i video-3.mp4 -ss 00:00:06 -frames:v 1 -vf scale=1280:-2 -q:v 3 \
    ../posters/poster-3.jpg

Web encoding (faststart matters most, playback starts before full download):

  ffmpeg -i input.mp4 -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p \
    -profile:v high -level 4.0 -an -movflags +faststart output.mp4
