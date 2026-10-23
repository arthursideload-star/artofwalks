---
format: 1080x1920
duration: 24s
message: "The photos already on your Airbnb listing can become a cinematic walkthrough video."
arc: Hook → Demo (photo comes alive) → Objections removed → Proof (photo | film) → Offer → Brand → loop
audience: Airbnb hosts, in-feed; reads muted, voiceover for sound-on
mode: autonomous
music: "original calm modern beat, 120 BPM half-time feel, 12 bars = 24.0 s, loop-safe"
beat_grid: "beat 0.5 s · bar 2.0 s · cuts at 1.5, 6, 8, 10, 12, 17, 22, 24(=0)"
voiceover: "ElevenLabs Everett, one take cut by vo.json; each line starts within 0.1 s of its on-screen copy"
---

# Storyboard — "Same photo. 6 seconds later."

`index.html` holds frame 1 and everything that crosses scene boundaries: the
photo card (continuous from frame 1 into the push of frame 2, and the target of
the loop morph), the hook copy, the glow, the AI label, the music and the voiceover. Frames 2–6
are sub-compositions in `compositions/` with scene-local time; frames 4 and 5
share one file because film V5 is continuous state across both (core
composition pattern C). Slot ids refer to `slots.json`.

## Frame 1 — Hook

- duration: 1.5s (0.0–1.5)
- status: animated
- src: index.html
- transition_in: loop morph from frame 6 (logo tile opens into the card)
- scene: A framed listing photo on black; the hook line is already on screen at frame 0.
- media: P1 (listing photo, 3:2)
- motion: kinetic-type-beats (blueprint) + waterfall-entry, ambient-glow-bloom, sine-wave-loop
- poster: 1.0

Frame 0 already reads: the card plus hook line 1, so the scroll stops on the
first frame. Line 2 lands on beat 2 (0.5 s) in orange. Pager dots and
"Photo 1 of 24" make it read as a listing photo without imitating any
platform UI. Hook variants (`hook` variable):

- **A** "This is your Airbnb photo." / **"Now watch."**
- **B** "Your listing photos" / **"are lying still."**
- **C** "No photoshoot." / **"Just your photos."**

VO: the hook line of the chosen variant, 0.04–2.9 s (A runs over the push-in:
"Now watch." lands at 2.1 s as the card starts to grow).

## Frame 2 — The card comes alive

- duration: 4.5s (1.5–6.0)
- status: animated
- src: compositions/s2-alive.html
- transition_in: camera push (card scales from framed to full-bleed)
- scene: Camera pushes into the photo until it fills the frame and becomes the film.
- media: P1 → V1 (film made from P1)
- motion: multi-phase-camera + card-morph-anchor (rules); depth-of-field-blur on the handoff
- copy: "Same photo." (3.0 s) / **"6 seconds later."** (4.0 s)
- vo: "Same photo." (3.1 s) / "Six seconds later." (4.15 s)
- poster: 4.0

Hook copy exits up at 1.25 s. The badge flips PHOTO → ● FILM at 1.5 s, the card
grows to full-bleed by 2.1 s, the film crossfades in on the downbeat (2.0 s)
and keeps a slow push to 6.0 s. A hairline orange progress bar fills under the
badge, quoting the site's hero progress bars.

## Frame 3 — Three cuts, no hassle

- duration: 6.0s (6.0–12.0)
- status: animated
- src: compositions/s3-cuts.html
- transition_in: cut (bar downbeats 6, 8, 10)
- scene: Three full-bleed film clips, one hard cut per bar, one phrase per cut.
- media: V2, V3, V4
- motion: kinetic-beat-slam (rule) on one shared beat array; three camera variants (push, drift, pull)
- copy: **No** crew. / **No** scheduling. / **No** strangers in your home.
- vo: each phrase 0.06 s after its cut (6.06, 8.06, 10.06 s)
- poster: 7.0

Each phrase enters differently (scale-slam, side-snap, word rise). A short
orange rule above the phrase re-grows on every cut so the eye has a fixed
anchor while the picture changes underneath.

## Frame 4 — Photo | Film

- duration: 5.0s (12.0–17.0)
- status: animated
- src: compositions/s45-split-offer.html
- transition_in: cut (12.0)
- scene: Full-bleed photo; a divider sweeps in and turns the right half into the film, then the whole frame.
- media: P2 (photo #2, the pool deck by day) | V5 (film from P2 that turns to dusk, ending on photo #11)
- motion: comparison-split (blueprint), nudge-curve divider sweep
- copy: "Your photos," / **"made cinematic."** (13.0 s)
- vo: "Your photos, made cinematic." (13.0 s) · "Delivered in days, not weeks." (15.3 s, over the wipe to the film)
- poster: 14.5

Labels PHOTO (left) and ● FILM (right) sit at the top of the safe zone. The
divider handle is the site's before/after arrow button in orange.

## Frame 5 — The offer

- duration: 5.0s (17.0–22.0)
- status: animated
- src: compositions/s45-split-offer.html
- transition_in: film blurs and dims behind a rising card
- scene: Price card over the blurred film; the hero price counts up.
- media: V5 (blurred background)
- motion: dataviz-countup (blueprint) → counting-dynamic-scale, spring-pop-entrance, ambient-glow-bloom (sheen)
- copy: "From" **€50** · "Full Walkthrough" **€749** · "Delivered in days, not weeks." · CTA pill "artofwalks.com"
- vo: "From fifty euros." (17.6 s) · "Full walkthrough, seven hundred forty-nine." (19.2 s)
- poster: 20.5

€50 counts 0→50 (17.4–18.4 s), €749 counts 0→749 (18.6–19.4 s). The card keeps
the site's featured-card orange edge. At 21.55 s the contents clear and the
card collapses into the logo tile (card-morph-anchor).

## Frame 6 — Logo, then loop

- duration: 2.0s (22.0–24.0)
- status: animated
- src: compositions/s6-logo.html
- transition_in: card collapses into the logo tile
- scene: Logo tile, wordmark, URL; the tile then opens back into the photo card of frame 1.
- media: P1 (re-enters inside the opening tile)
- motion: logo-assemble-lockup (blueprint); card-morph-anchor for the loop morph
- copy: "ArtOfWalks" wordmark · **artofwalks.com**
- vo: "Art of walks dot com." (22.1–23.5 s); silence across the loop point
- poster: 22.8

The play triangle springs in on the downbeat (22.0 s), wordmark and URL follow.
From 23.15 s the tile's window widens into the photo card and hook line 1 fades
in, settling by 23.85 s into exactly the frame-0 state, so the platform loop is
seamless.

## Sound

Music bed (`bgm_001`) at 1.2x, carved around the voice with the HyperFrames
voiceover carve (strength 0.8: six band dips plus a level envelope), made
loop-safe by `scripts/loop-carve.mjs` so the bed has the same gain at 24 s and
0 s. A true-peak limiter at -2 dBTP sits on the master. The voice is built per
hook by `scripts/voiceover.mjs` (gentle 2:1 compression, peak limiter); the
mix measures about -14 LUFS.
