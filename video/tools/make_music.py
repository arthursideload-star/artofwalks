#!/usr/bin/env python3
"""Original music bed for the ArtOfWalks ad — synthesized from scratch, no samples.

120 BPM, 4/4, 12 bars = exactly 24.0 s. Progression (C major):
  | Fmaj9 | G6 | Am9 | Cmaj9 |  x3  — bar 12 lands on the tonic under the logo,
and Cmaj9 -> Fmaj9 makes the loop seam a plain IV move.

Loop safety: the 24 s arrangement is rendered three times back to back and the
middle cycle is kept, so every reverb tail and release that crosses the seam is
already inside the file. Played on repeat it has no seam.

Accents follow the ad's cut grid: drums enter at 1.5 s (pickup) and land at
2.0 s, impacts on 6 / 8 / 10 s (the three cuts), swell into 12 s (split
screen), divider whooshes at 12.5 s and 15.5 s, arpeggio over the price
count-up (17-20 s), impact + tonic chord at 22 s (logo), reverse swell into the
loop at 23-24 s.

Usage: python3 tools/make_music.py <out.wav>
Only numpy is required. Deterministic (fixed seed).
"""
import sys
import wave
import zlib
from functools import lru_cache

import numpy as np

SR = 48000
BPM = 120
BEAT = 60 / BPM          # 0.5 s
BAR = 4 * BEAT           # 2.0 s
BARS = 12
CYCLE = BARS * BAR       # 24.0 s
N_CYCLE = int(CYCLE * SR)


def R(*key):
    """Deterministic RNG per instrument call: identical cycles make the loop seam exact."""
    return np.random.default_rng(zlib.crc32(repr(("aow",) + key).encode()))


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a, d, s, r_start, r, sr=SR):
    """Sample envelope of length n: attack a, decay d to sustain s, release r from r_start (s)."""
    t = np.arange(n) / sr
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    dec = (t >= a) & (t < a + d)
    e = np.where(dec, 1 - (1 - s) * (t - a) / max(d, 1e-6), e)
    e = np.where(t >= a + d, s, e)
    rel = t >= r_start
    e = np.where(rel, e * np.exp(-(t - r_start) / max(r, 1e-6) * 4.0), e)
    return e


def fft_filter(x, lo=None, hi=None, sr=SR, order=2):
    """Zero-phase spectral filter (smooth Butterworth-like magnitude)."""
    n = len(x)
    nfft = 1 << (n - 1).bit_length()
    X = np.fft.rfft(x, nfft)
    f = np.fft.rfftfreq(nfft, 1 / sr)
    H = np.ones_like(f)
    if hi:
        H *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        with np.errstate(divide="ignore"):
            H *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * H, nfft)[:n]


def add(buf, x, t0, gain=1.0, pan=0.0):
    """Mix mono x into stereo buf at time t0 (s), equal-power pan -1..1."""
    i0 = int(round(t0 * SR))
    if i0 >= len(buf):
        return
    if i0 < 0:
        x = x[-i0:]
        i0 = 0
    x = x[: len(buf) - i0]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i0 : i0 + len(x), 0] += x * gain * l
    buf[i0 : i0 + len(x), 1] += x * gain * r


# ---------------------------------------------------------------- instruments

@lru_cache(maxsize=None)
def pad_note(freq, dur, bright=1.0, voices=3):
    """Warm additive saw-ish pad, three detuned voices, returns (L, R)."""
    n = int((dur + 1.6) * SR)
    t = np.arange(n) / SR
    out_l = np.zeros(n)
    out_r = np.zeros(n)
    detunes = [-0.07, 0.0, 0.07][:voices]   # semitones
    nh = 14
    for vi, dt in enumerate(detunes):
        f = freq * 2 ** (dt / 12)
        ph = R("pad", round(freq, 3), vi).uniform(0, 2 * np.pi, nh)
        v = np.zeros(n)
        for h in range(1, nh + 1):
            if f * h > 7000:
                break
            amp = (1 / h ** 1.7) * np.exp(-(h - 1) / (5.5 * bright))
            v += amp * np.sin(2 * np.pi * f * h * t + ph[h - 1])
        pan = (vi - (len(detunes) - 1) / 2) * 0.7
        out_l += v * np.cos((pan + 1) * np.pi / 4)
        out_r += v * np.sin((pan + 1) * np.pi / 4)
    e = env_adsr(n, 0.55, 0.8, 0.82, dur, 1.4)
    return out_l * e, out_r * e


@lru_cache(maxsize=None)
def epiano(freq, dur=2.6, vel=1.0):
    """FM electric piano: 1:1 modulator with decaying index + a short tine."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = 1.6 * vel * np.exp(-t * 2.2) + 0.25
    mod = np.sin(2 * np.pi * freq * t)
    body = np.sin(2 * np.pi * freq * t + idx * mod)
    tine = 0.18 * vel * np.sin(2 * np.pi * freq * 14.0 * t) * np.exp(-t * 28)
    amp = np.exp(-t * 1.25) * (1 - np.exp(-t * 400))
    x = (body + tine) * amp
    return fft_filter(x, hi=6500)


@lru_cache(maxsize=None)
def bass_note(freq, dur):
    n = int((dur + 0.3) * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.32 * np.sin(4 * np.pi * freq * t) + 0.12 * np.sin(6 * np.pi * freq * t)
    x = np.tanh(1.4 * x) / np.tanh(1.4)
    e = env_adsr(n, 0.012, 0.25, 0.7, dur, 0.18)
    return x * e


@lru_cache(maxsize=None)
def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = fft_filter(R("kick").standard_normal(n), lo=1500, hi=6000) * np.exp(-t * 300) * 0.25
    return np.tanh(1.6 * (body + click))


@lru_cache(maxsize=None)
def clap():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    noise = R("clap").standard_normal(n)
    bursts = sum(np.exp(-np.clip(t - d, 0, None) * 90) * (t >= d) for d in (0.0, 0.011, 0.022))
    tail = np.exp(-t * 14)
    x = fft_filter(noise, lo=1100, hi=5200) * (0.6 * bursts + 0.5 * tail)
    body = 0.35 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return x + body


@lru_cache(maxsize=None)
def hat(open_=False):
    n = int((0.35 if open_ else 0.08) * SR)
    t = np.arange(n) / SR
    x = fft_filter(R("hat", open_).standard_normal(n), lo=7000, hi=12500)
    return x * np.exp(-t * (11 if open_ else 55))


@lru_cache(maxsize=None)
def impact():
    """Soft sub boom for cut accents."""
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = 38 + 40 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    air = fft_filter(R("impact").standard_normal(n), lo=300, hi=2500) * np.exp(-t * 18) * 0.12
    return boom + air


@lru_cache(maxsize=None)
def swell(dur, lo_start=400, lo_end=4000):
    """Rising filtered-noise swell that peaks at its end."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = R("swell", dur, lo_start, lo_end).standard_normal(n)
    # crossfade three bands so the swell brightens as it rises
    b1 = fft_filter(noise, lo=lo_start, hi=lo_start * 3)
    b2 = fft_filter(noise, lo=(lo_start + lo_end) / 2, hi=lo_end * 1.5)
    k = (t / dur) ** 2
    x = b1 * (1 - k) + b2 * k
    amp = (t / dur) ** 2.4
    fade = np.minimum(1, (dur - t) / 0.012)
    return x * amp * fade


@lru_cache(maxsize=None)
def whoosh(dur=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = R("whoosh", dur).standard_normal(n)
    x = fft_filter(noise, lo=500, hi=3500)
    amp = np.sin(np.pi * t / dur) ** 2
    return x * amp


# ---------------------------------------------------------------- arrangement

CHORDS = [  # (bass midi, pad voicing)
    (41, [57, 60, 64, 67]),   # Fmaj9  (F | A C E G)
    (43, [59, 62, 64, 67]),   # G6     (G | B D E G)
    (45, [59, 60, 64, 67]),   # Am9    (A | B C E G)
    (36, [55, 59, 62, 64]),   # Cmaj9  (C | G B D E)
]
MOTIF = {  # e-piano notes per chord: (beat offset, midi, velocity)
    0: [(0.0, 72, 0.9), (1.0, 76, 0.7), (2.5, 79, 0.6)],
    1: [(0.5, 74, 0.7), (1.5, 79, 0.6), (3.0, 76, 0.6)],
    2: [(0.0, 72, 0.8), (1.0, 76, 0.6), (2.5, 74, 0.6), (3.5, 71, 0.5)],
    3: [(0.0, 76, 0.8), (1.5, 74, 0.6), (2.5, 79, 0.65)],
}


def render_cycle(buf, c0, rev_send):
    """Write one 24 s cycle starting at time c0 into buf (and the reverb send)."""
    for bar in range(BARS):
        t_bar = c0 + bar * BAR
        bass, voicing = CHORDS[bar % 4]
        bright = 1.0 if bar < 8 else 1.35          # pad opens up under the price card
        drums = 1 <= bar <= 10
        # pad
        for m in voicing:
            l, r = pad_note(midi(m), BAR, bright=bright)
            i0 = int(round(t_bar * SR))
            seg = slice(i0, min(i0 + len(l), len(buf)))
            k = seg.stop - seg.start
            buf[seg, 0] += l[:k] * 0.045
            buf[seg, 1] += r[:k] * 0.045
            rev_send[seg, 0] += l[:k] * 0.03
            rev_send[seg, 1] += r[:k] * 0.03
        # bass (from the drop on)
        if bar >= 1 and bar <= 11:
            pattern = [(0.0, 1.6), (2.0, 0.7), (3.5, 0.45)] if drums else [(0.0, 3.6)]
            for b, d in pattern:
                x = bass_note(midi(bass + 12 if bass < 40 else bass), d * BEAT)
                add(buf, x, t_bar + b * BEAT, gain=0.16)
        # e-piano motif (every bar; quieter while drums play)
        for b, m, v in MOTIF[bar % 4]:
            x = epiano(midi(m), vel=v)
            g = 0.16 if drums else 0.2
            pan = [-0.35, 0.25, -0.1, 0.4][int(b * 2) % 4]
            add(buf, x, t_bar + b * BEAT, gain=g * v, pan=pan)
            add(rev_send, x, t_bar + b * BEAT, gain=g * v * 0.9, pan=pan)
        # drums
        if drums:
            for b in (0.0, 1.75):                      # half-time: kick 1 and the "a" of 2
                add(buf, kick(), t_bar + b * BEAT, gain=0.36)
            add(buf, clap(), t_bar + 2.0 * BEAT, gain=0.2)
            add(rev_send, clap(), t_bar + 2.0 * BEAT, gain=0.12)
            for i in range(8):
                vel = 0.55 if i % 2 else 0.32
                add(buf, hat(), t_bar + i * 0.5 * BEAT, gain=0.16 * vel, pan=0.3)
            if bar in (3, 4, 5):                       # cuts: 16th ghost hats for lift
                for i in range(16):
                    if i % 2:
                        add(buf, hat(), t_bar + i * 0.25 * BEAT, gain=0.04, pan=-0.3)
            if bar % 2 == 1:
                add(buf, hat(open_=True), t_bar + 3.5 * BEAT, gain=0.08, pan=0.3)
    # bar 1 pickup at 1.5 s: two hats announce the camera move
    add(buf, hat(), c0 + 1.5, gain=0.09, pan=0.3)
    add(buf, hat(), c0 + 1.75, gain=0.12, pan=0.3)
    # accents tied to the picture
    add(buf, swell(0.9, 300, 3500), c0 + 1.1, gain=0.15)            # into the drop
    add(rev_send, swell(0.9, 300, 3500), c0 + 1.1, gain=0.03)
    for t in (2.0, 6.0, 8.0, 10.0):                                 # drop + three cuts
        add(buf, impact(), c0 + t, gain=0.28 if t == 2.0 else 0.2)
    add(buf, swell(0.6, 500, 4000), c0 + 11.4, gain=0.11)          # into the split
    add(buf, whoosh(0.9), c0 + 12.5, gain=0.09, pan=0.5)           # divider in
    add(buf, whoosh(1.0), c0 + 15.5, gain=0.08, pan=-0.5)           # divider across
    for i in range(16):                                             # arpeggio over the count-up (17.5-21.5 s)
        notes = [72, 76, 79, 83, 84, 83, 79, 76]
        m = notes[i % 8]
        add(buf, epiano(midi(m), dur=0.9, vel=0.45), c0 + 17.5 + i * 0.5 * BEAT, gain=0.05, pan=0.2 if i % 2 else -0.2)
    add(buf, impact(), c0 + 22.0, gain=0.24)                        # logo
    for m in (60, 64, 67, 71, 74):                                  # tonic chord stab
        x = epiano(midi(m), dur=3.2, vel=0.75)
        add(buf, x, c0 + 22.0, gain=0.08)
        add(rev_send, x, c0 + 22.0, gain=0.06)
    add(buf, swell(1.0, 300, 3000), c0 + 23.0, gain=0.09)           # reverse swell into the loop
    add(rev_send, swell(1.0, 300, 3000), c0 + 23.0, gain=0.03)


def reverb_ir(seconds=2.2):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    irs = []
    for ch in range(2):
        noise = np.random.default_rng(7 + ch).standard_normal(n)
        noise = fft_filter(noise, lo=180, hi=6500)
        e = np.exp(-t * 3.1) * (1 - np.exp(-t * 90))
        irs.append(noise * e)
    ir = np.stack(irs, 1)
    return ir / np.sqrt((ir ** 2).sum(0)).max()


def convolve(x, ir):
    out = np.zeros((len(x), 2))
    nfft = 1 << (len(x) + len(ir) - 1).bit_length()
    for ch in range(2):
        X = np.fft.rfft(x[:, ch], nfft)
        H = np.fft.rfft(ir[:, ch], nfft)
        out[:, ch] = np.fft.irfft(X * H, nfft)[: len(x)]
    return out


def main(path):
    total = 3 * N_CYCLE
    dry = np.zeros((total, 2))
    send = np.zeros((total, 2))
    for c in range(3):
        render_cycle(dry, c * CYCLE, send)
    wet = convolve(send, reverb_ir())
    mix = dry + 0.55 * wet
    mix = mix[N_CYCLE : 2 * N_CYCLE]            # keep the middle cycle: seam-free loop
    mix = fft_filter(mix[:, 0], lo=28)[:, None] * [1, 0] + fft_filter(mix[:, 1], lo=28)[:, None] * [0, 1]
    # gentle bus glue: soft clip, then normalise to -1 dBFS peak
    peak = np.abs(mix).max()
    mix = np.tanh(mix / peak * 1.0) / np.tanh(1.0)
    mix *= 10 ** (-1.0 / 20) / np.abs(mix).max()
    pcm = (mix * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {path}: {len(mix) / SR:.3f} s, {SR} Hz stereo")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "aow-loop-120bpm.wav")
