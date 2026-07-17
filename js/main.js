/* ArtOfWalks · carousel, lazy video slots, reveals */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const VIDEO_SLOTS = 3;
  const PHOTO_SLOTS = 4;

  /* ---------- video slots (shared) ----------
     Every video is a drop-in slot: poster/gradient by default,
     footage fades in when the file exists, discreet hint when it doesn't. */
  function wireSlot(container, video, { onReady } = {}) {
    if (!video) return;
    const markMissing = () => container.classList.add("no-video");
    const markReady = () => {
      container.classList.remove("no-video");
      container.classList.add("has-video");
      if (onReady) onReady();
    };
    video.addEventListener("loadeddata", markReady, { once: true });
    video.addEventListener("error", markMissing, { once: true });
    const source = video.querySelector("source");
    if (source) source.addEventListener("error", markMissing, { once: true });
  }

  const safePlay = (video) => {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };

  /* probe the drop-in files once so empty slots show their hint immediately
     (video/img error events stay wired as the source of truth) */
  if (location.protocol !== "file:") {
    for (let n = 1; n <= VIDEO_SLOTS; n++) {
      fetch(`assets/videos/video-${n}.mp4`, { method: "HEAD" })
        .then((res) => { if (!res.ok) throw new Error(); })
        .catch(() => document.querySelectorAll(`[data-slot="${n}"]`)
          .forEach((el) => el.classList.add("no-video")));
    }
    for (let n = 1; n <= PHOTO_SLOTS; n++) {
      fetch(`assets/photos/photo-${n}.jpg`, { method: "HEAD" })
        .then((res) => { if (!res.ok) throw new Error(); })
        .catch(() => fetch(`assets/photos/photo-${n}.png`, { method: "HEAD" })
          .then((res) => { if (!res.ok) throw new Error(); })
          .then(() => {
            const img = document.querySelector(`[data-photo="${n}"] img`);
            if (img) img.src = `assets/photos/photo-${n}.png`;
          })
          .catch(() => document.querySelectorAll(`[data-photo="${n}"]`)
            .forEach((el) => el.classList.add("no-photo"))));
    }
  }

  /* ---------- hero carousel ---------- */
  const carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    const slides = [...carousel.querySelectorAll(".slide")];
    const dots = [...document.querySelectorAll(".dot")];
    const hero = carousel.closest(".hero");
    const playPauseBtn = document.querySelector("[data-playpause]");
    const AUTOPLAY_MS = 7000;
    hero.style.setProperty("--slide-ms", AUTOPLAY_MS + "ms");

    let index = 0;
    let timer = null;
    let userPaused = false;
    let heroVisible = true;

    slides.forEach((slide) => {
      const video = slide.querySelector("video");
      wireSlot(slide, video, {
        onReady: () => {
          if (slide.classList.contains("is-active") && !userPaused && heroVisible && !reducedMotion.matches) {
            safePlay(video);
          }
        },
      });
    });

    const loadSlide = (slide) => {
      const video = slide.querySelector("video");
      if (video && video.readyState === 0) video.load();
      return video;
    };

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle("is-active", active);
        const video = slide.querySelector("video");
        if (!video) return;
        if (active) {
          loadSlide(slide);
          if (!userPaused && heroVisible && !reducedMotion.matches && slide.classList.contains("has-video")) {
            safePlay(video);
          }
        } else if (!video.paused) {
          video.pause();
        }
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-selected", String(i === index));
      });
      // warm up the next slide so the crossfade lands on ready footage
      loadSlide(slides[(index + 1) % slides.length]);
    };

    const stopTimer = () => { clearInterval(timer); timer = null; };
    const startTimer = () => {
      stopTimer();
      if (userPaused || reducedMotion.matches || !heroVisible) return;
      timer = setInterval(() => show(index + 1), AUTOPLAY_MS);
    };

    document.querySelector("[data-next]")?.addEventListener("click", () => { show(index + 1); startTimer(); });
    document.querySelector("[data-prev]")?.addEventListener("click", () => { show(index - 1); startTimer(); });
    dots.forEach((dot) => dot.addEventListener("click", () => { show(Number(dot.dataset.goto)); startTimer(); }));

    playPauseBtn?.addEventListener("click", () => {
      userPaused = !userPaused;
      hero.classList.toggle("is-paused", userPaused);
      playPauseBtn.setAttribute("aria-label", userPaused ? "Play showcase" : "Pause showcase");
      const video = slides[index].querySelector("video");
      if (userPaused) {
        stopTimer();
        video?.pause();
      } else {
        if (video && slides[index].classList.contains("has-video")) safePlay(video);
        startTimer();
      }
    });

    // don't burn battery when the hero is off-screen or the tab is hidden
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      const video = slides[index].querySelector("video");
      if (!heroVisible) {
        stopTimer();
        video?.pause();
      } else {
        if (!userPaused && !reducedMotion.matches && video && slides[index].classList.contains("has-video")) safePlay(video);
        startTimer();
      }
    }, { threshold: 0.15 }).observe(hero);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopTimer();
      else startTimer();
    });

    show(0);
    startTimer();
  }

  /* ---------- portfolio: hover to preview, click for sound ---------- */
  const works = [...document.querySelectorAll(".work")];
  works.forEach((work) => {
    const media = work.querySelector(".work-media");
    const video = media.querySelector("video");
    const playBtn = media.querySelector(".play-btn");
    wireSlot(media, video);

    const isBlocked = () =>
      media.classList.contains("no-video") || work.classList.contains("no-video");

    playBtn?.addEventListener("click", () => {
      if (isBlocked()) return;
      // one voice at a time
      works.forEach((other) => {
        if (other === work) return;
        const v = other.querySelector("video");
        if (v && !v.paused) v.pause();
      });
      if (video.readyState === 0) video.load();
      video.muted = false;
      video.controls = true;
      media.classList.add("is-playing");
      media.dataset.activated = "true";
      safePlay(video);
    });

    // silent preview on hover, desktop only, until the film was opened for real
    if (canHover.matches && !reducedMotion.matches) {
      media.addEventListener("mouseenter", () => {
        if (isBlocked() || media.dataset.activated) return;
        if (video.readyState === 0) video.load();
        video.muted = true;
        safePlay(video);
      });
      media.addEventListener("mouseleave", () => {
        if (media.dataset.activated) return;
        video.pause();
      });
    }

    video?.addEventListener("error", () => {
      media.classList.remove("is-playing");
      delete media.dataset.activated;
      video.controls = false;
      video.muted = true;
    });
  });

  /* ---------- pricing spotlight ---------- */
  if (canHover.matches) {
    document.querySelectorAll(".price-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--sx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--sy", `${e.clientY - rect.top}px`);
      });
    });
  }

  /* ---------- before & after ---------- */
  const baVideoBox = document.querySelector(".ba-video");
  if (baVideoBox) {
    const video = baVideoBox.querySelector("video");
    wireSlot(baVideoBox, video);
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (video.readyState === 0 && !baVideoBox.classList.contains("no-video")) video.load();
        if (baVideoBox.classList.contains("has-video") && !reducedMotion.matches) safePlay(video);
      } else if (!video.paused) {
        video.pause();
      }
    }, { threshold: 0.3 }).observe(baVideoBox);
  }

  document.querySelectorAll(".ba-photo").forEach((box) => {
    const img = box.querySelector("img");
    if (!img) return;
    const ready = () => box.classList.add("has-photo");
    if (img.complete && img.naturalWidth > 0) ready();
    else {
      img.addEventListener("load", ready);
      img.addEventListener("error", () => {
        if (!img.dataset.retried) {
          img.dataset.retried = "true";
          img.src = img.src.replace(/\.jpg$/, ".png");
        } else {
          box.classList.add("no-photo");
        }
      });
    }
  });

  /* ---------- scroll reveals ---------- */
  const revealables = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- nav scroll state ---------- */
  const nav = document.querySelector(".site-nav");
  const sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:48px;height:1px;width:1px;pointer-events:none;";
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    nav.classList.toggle("is-scrolled", !entry.isIntersecting);
  }).observe(sentinel);

  /* ---------- environment watchdog ----------
     Some embedded/headless renderers never deliver IntersectionObserver
     callbacks or run animations. If IO stays silent, show everything. */
  let ioAlive = false;
  const pulse = new IntersectionObserver(() => {
    ioAlive = true;
    pulse.disconnect();
  });
  pulse.observe(document.body);
  setTimeout(() => {
    if (ioAlive) return;
    document.documentElement.classList.add("no-motion");
    revealables.forEach((el) => el.classList.add("in-view"));
    nav.classList.add("is-scrolled");
  }, 1200);
})();
