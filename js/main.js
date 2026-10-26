/* ArtOfWalks · hero video, example films, checkout fallbacks, nav, reveals */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  /* Address used when a Stripe link has not been filled in yet. Keep in sync
     with the address in index.html, legal.html, terms.html and thanks.html. */
  const CONTACT_EMAIL = "artofwalks@gmail.com";

  const mailto = (subject, lines) =>
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\r\n"))}`;

  /* ---------- video slots (shared) ----------
     Every video fades in once its file is ready. If a file is missing or the
     browser can't decode it, the poster simply stays — no error text ever
     reaches the visitor. */
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

  /* ---------- hero video ----------
     One background film. Portrait screens get the 9:16 cut, which is what
     object-fit: cover would show of the 16:9 file anyway, at a third of the
     size. Reduced motion and data saver start paused; the button plays it. */
  const heroMedia = document.querySelector("[data-hero]");
  if (heroMedia) {
    const hero = heroMedia.closest(".hero");
    const video = heroMedia.querySelector("video");
    const source = video && video.querySelector("source");
    const toggle = document.querySelector("[data-hero-toggle]");
    let userPaused = reducedMotion.matches || saveData;
    let heroVisible = true;
    let started = false;

    if (source && source.dataset.portraitSrc && window.matchMedia("(max-aspect-ratio: 4/5)").matches) {
      source.src = source.dataset.portraitSrc;
    }

    const start = () => {
      if (started || !video) return;
      started = true;
      video.load();
    };

    const sync = () => {
      hero.classList.toggle("is-paused", userPaused);
      toggle?.setAttribute("aria-label", userPaused ? "Hintergrundvideo abspielen" : "Hintergrundvideo anhalten");
    };

    wireSlot(heroMedia, video, {
      onReady: () => { if (!userPaused && heroVisible) safePlay(video); },
    });

    toggle?.addEventListener("click", () => {
      userPaused = !userPaused;
      sync();
      if (userPaused) {
        video?.pause();
      } else if (!started) {
        start();
      } else if (heroMedia.classList.contains("has-video")) {
        safePlay(video);
      }
    });

    // don't burn battery when the hero is off-screen or the tab is hidden
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (!video) return;
      if (!heroVisible) video.pause();
      else if (!userPaused && heroMedia.classList.contains("has-video")) safePlay(video);
    }, { threshold: 0.15 }).observe(hero);

    document.addEventListener("visibilitychange", () => {
      if (!video) return;
      if (document.hidden) video.pause();
      else if (!userPaused && heroVisible && heroMedia.classList.contains("has-video")) safePlay(video);
    });

    sync();
    if (!userPaused) start();
  }

  /* ---------- example films: silent preview, click for controls ----------
     data-playable="preview" loads and loops muted while on screen;
     data-playable="hover" previews on mouse-over (desktop) only. The play
     button hands over to the native controls. The films carry no audio
     track yet, but unmuting stays wired so adding music needs no code. */
  const playables = [...document.querySelectorAll("[data-playable]")];

  const pauseOtherFilms = (current) => {
    playables.forEach((other) => {
      if (other === current) return;
      const v = other.querySelector("video");
      if (v && !v.paused) v.pause();
    });
  };

  const autoplayAllowed = () => !reducedMotion.matches && !saveData;

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
        if (autoPreview && autoplayAllowed() && !media.dataset.activated && isVisible(media)) {
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

    if (canHover.matches && autoplayAllowed() && !autoPreview) {
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

    if (autoPreview) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          if (!autoplayAllowed() || media.dataset.activated || blocked()) return;
          load();
          if (media.classList.contains("has-video")) safePlay(video);
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

  /* ---------- checkout ----------
     Every buy button points at a Stripe payment link. Until a link is filled
     in (it still contains REPLACE_), the button falls back to an order email
     so it is never a dead end. */
  document.querySelectorAll("[data-buy]").forEach((btn) => {
    const href = btn.getAttribute("href") || "";
    if (!href.includes("REPLACE_")) return;
    const pkg = btn.dataset.package || "Objekt-Film";
    const price = btn.dataset.price;
    const label = price ? `${pkg} (${price})` : pkg;
    btn.href = mailto(`Bestellung: ${label}`, [
      "Guten Tag,",
      "",
      `ich möchte folgendes Paket bestellen: ${label}.`,
      "",
      "Firma:",
      "Ansprechpartner:",
      "Rechnungsadresse:",
      "",
      "Viele Grüße",
    ]);
    btn.dataset.buyFallback = "true";
  });

  /* Same for the Stripe customer portal (manage / cancel a subscription). */
  document.querySelectorAll("[data-portal]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href.includes("REPLACE_")) return;
    link.href = mailto("Abo verwalten", [
      "Guten Tag,",
      "",
      "ich möchte mein Abo ändern oder kündigen.",
      "",
      "Firma:",
      "E-Mail-Adresse der Bestellung:",
      "Gewünschte Änderung:",
      "",
      "Viele Grüße",
    ]);
    link.dataset.portalFallback = "true";
  });

  /* ---------- mobile menu ---------- */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileMenu = document.getElementById("mobile-menu");
  if (navToggle && mobileMenu) {
    const setOpen = (open) => {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
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
    const targets = [document.getElementById("preise"), document.querySelector(".site-footer")].filter(Boolean);
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
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- nav over the hero ----------
     With JS the nav starts transparent over the hero (see the
     [data-overlay]:not(.is-scrolled) rules in styles.css) and turns solid
     once the page scrolls. Without JS it is solid from the start. */
  const nav = document.querySelector(".site-nav[data-overlay]");
  if (nav) {
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:48px;height:1px;width:1px;pointer-events:none;";
    document.body.prepend(sentinel);
    new IntersectionObserver(([entry]) => {
      nav.classList.toggle("is-scrolled", !entry.isIntersecting);
    }).observe(sentinel);
  }

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
    nav?.classList.add("is-scrolled");
  }, 1200);
})();
