/* ArtOfWalks · carousel, video slots, checkout, reveals */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* Address used when a Stripe link has not been filled in yet. Keep in sync
     with the address in index.html, legal.html and thanks.html. */
  const CONTACT_EMAIL = "artofwalks@gmail.com";

  /* ---------- video slots (shared) ----------
     Every video fades in once its file is ready. If a file is missing or the
     browser can't decode it, the poster/gradient simply stays — no error text
     ever reaches the visitor. */
  function wireSlot(container, video, { onReady } = {}) {
    if (!video) return;
    const markMissing = () => {
      container.classList.remove("has-video");
      container.classList.add("no-video");
    };
    const markReady = () => {
      container.classList.remove("no-video");
      container.classList.add("has-video");
      if (onReady) onReady();
    };
    if (video.readyState >= 2) markReady();
    else video.addEventListener("loadeddata", markReady, { once: true });
    video.addEventListener("error", markMissing, { once: true });
    const source = video.querySelector("source");
    if (source) source.addEventListener("error", markMissing, { once: true });
  }

  const safePlay = (video) => {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };

  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  };

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

  /* ---------- playable films: preview, click to open ----------
     Used by the portfolio cards and by the before/after result. The video
     loads lazily and starts muted as soon as it is both ready and on screen;
     the play button hands over to the native controls. The showcase films
     currently carry no audio track, but unmuting stays wired so adding music
     later needs no code change. */
  const playables = [...document.querySelectorAll("[data-playable]")];

  const pauseOtherFilms = (current) => {
    playables.forEach((other) => {
      if (other === current) return;
      const v = other.querySelector("video");
      if (v && !v.paused) v.pause();
    });
  };

  playables.forEach((media) => {
    const video = media.querySelector("video");
    if (!video) return;
    const playBtn = media.querySelector(".play-btn");
    const autoPreview = media.dataset.playable === "preview";

    const blocked = () => media.classList.contains("no-video");
    const load = () => { if (video.readyState === 0) video.load(); };

    // The onReady callback is what actually starts the preview. Checking
    // readiness inline would always run before the file has loaded.
    wireSlot(media, video, {
      onReady: () => {
        if (autoPreview && !reducedMotion.matches && !media.dataset.activated && isVisible(media)) {
          safePlay(video);
        }
      },
    });

    playBtn?.addEventListener("click", () => {
      if (blocked()) return;
      pauseOtherFilms(media);
      load();
      video.muted = false;
      video.controls = true;
      media.classList.add("is-playing");
      media.dataset.activated = "true";
      safePlay(video);
    });

    // silent preview on hover, desktop only, until the film was opened for real
    if (canHover.matches && !reducedMotion.matches && !autoPreview) {
      media.addEventListener("mouseenter", () => {
        if (blocked() || media.dataset.activated) return;
        load();
        video.muted = true;
        safePlay(video);
      });
      media.addEventListener("mouseleave", () => {
        if (media.dataset.activated) return;
        video.pause();
      });
    }

    // auto-preview films load and loop as soon as they scroll into view
    if (autoPreview) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          if (!blocked()) load();
          if (media.classList.contains("has-video") && !reducedMotion.matches && !media.dataset.activated) {
            safePlay(video);
          }
        } else if (!video.paused && !media.dataset.activated) {
          video.pause();
        }
      }, { threshold: 0.3 }).observe(media);
    }

    video.addEventListener("error", () => {
      media.classList.remove("is-playing");
      delete media.dataset.activated;
      video.controls = false;
      video.muted = true;
    });
  });

  /* ---------- before & after photos ---------- */
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

  /* ---------- checkout ----------
     Every buy button points at a Stripe payment link. Until a link is filled
     in, the button falls back to an email order so it is never a dead end. */
  document.querySelectorAll("[data-buy]").forEach((btn) => {
    const href = btn.getAttribute("href") || "";
    if (!href.includes("REPLACE_")) return;
    const pkg = btn.dataset.package || "a video";
    const price = btn.dataset.price;
    const subject = `Order: ${pkg}${price ? ` (€${price})` : ""}`;
    const body = `Hi! I'd like to order the ${pkg}${price ? ` (€${price})` : ""} for my listing.`;
    btn.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    btn.dataset.buyFallback = "true";
  });

  /* ---------- sale countdown ---------- */
  const sale = document.querySelector("[data-sale-end]");
  if (sale) {
    const target = new Date(`${sale.dataset.saleEnd}T23:59:59`);
    const slot = sale.querySelector("[data-sale-countdown]");
    if (slot && !Number.isNaN(target.getTime())) {
      const days = Math.ceil((target - Date.now()) / 86400000);
      if (days > 1) {
        slot.textContent = `Ends in ${days} days.`;
      } else if (days === 1) {
        slot.textContent = "Ends tomorrow.";
      } else if (days === 0) {
        slot.textContent = "Last day.";
      } else {
        sale.hidden = true;
      }
    }
  }

  /* ---------- mobile menu ---------- */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileMenu = document.getElementById("mobile-menu");
  if (navToggle && mobileMenu) {
    const setOpen = (open) => {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenu.hidden = !open;
      document.body.classList.toggle("menu-open", open);
    };
    navToggle.addEventListener("click", () => {
      setOpen(navToggle.getAttribute("aria-expanded") !== "true");
    });
    mobileMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "A") setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        navToggle.focus();
      }
    });
  }

  /* ---------- sticky buy bar ----------
     Appears once the hero is behind you, hides again over the pricing table
     and the footer so it never covers what it points at. */
  const buybar = document.querySelector("[data-buybar]");
  if (buybar) {
    const hero = document.querySelector(".hero");
    const pricing = document.getElementById("pricing");
    const footer = document.querySelector(".site-footer");
    let pastHero = false;
    let overTarget = false;

    const sync = () => {
      const show = pastHero && !overTarget;
      buybar.hidden = !show;
      document.body.classList.toggle("has-buybar", show);
    };

    if (hero) {
      new IntersectionObserver(([entry]) => {
        pastHero = !entry.isIntersecting;
        sync();
      }, { threshold: 0.05 }).observe(hero);
    }

    const targets = [pricing, footer].filter(Boolean);
    if (targets.length) {
      const seen = new Set();
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) seen.add(entry.target);
          else seen.delete(entry.target);
        });
        overTarget = seen.size > 0;
        sync();
      }, { threshold: 0.05 });
      targets.forEach((t) => io.observe(t));
    }
  }

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
