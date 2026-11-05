/* ArtOfWalks · checkout fallbacks, e-mail dialog, floor plan, film, price
   calculator, copy button, menu, mobile bar, ticking checklist */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const autoplayAllowed = () => !reducedMotion.matches && !saveData;

  /* Address used when a Stripe link has not been filled in yet. Keep in sync
     with the address in index.html, legal.html, terms.html and thanks.html. */
  const CONTACT_EMAIL = "artofwalks@gmail.com";

  const mailto = (subject, lines) =>
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\r\n"))}`;

  const euro = (n) => `${n.toLocaleString("de-DE")} €`;

  const safePlay = (video) => {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };

  /* ---------- checkout ----------
     Every buy button points at a Stripe payment link. Until a link is filled
     in (it still contains REPLACE_), the button falls back to an order email
     so it is never a dead end. Runs first: the calculator copies these hrefs. */
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
    link.href = mailto("Login: Abo oder Rechnung", [
      "Guten Tag,",
      "",
      "ich brauche Zugang zu meinem Kundenkonto (Rechnung, Abo ändern oder kündigen).",
      "",
      "Firma:",
      "E-Mail-Adresse der Bestellung:",
      "Gewünschte Änderung:",
      "",
      "Viele Grüße",
    ]);
    link.dataset.portalFallback = "true";
  });

  /* ---------- e-mail dialog ----------
     A mailto link does nothing on a computer without a mail program, and
     ordering, the free sample and every question run through e-mail. So each
     mailto link opens a small dialog instead: mail program, Gmail or Outlook
     in the browser, or copy the address and the prepared text by hand. */
  const ICON_X = '<svg class="icon" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>';

  const parseMailto = (href) => {
    const [address, query = ""] = href.slice("mailto:".length).split("?");
    const params = new URLSearchParams(query.replace(/\+/g, "%2B"));
    return {
      to: decodeURIComponent(address) || CONTACT_EMAIL,
      subject: params.get("subject") || "",
      body: params.get("body") || "",
    };
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;opacity:0;";
      document.body.append(area);
      area.select();
      const done = document.execCommand("copy");
      area.remove();
      return done;
    }
  };

  let mailDialog = null;
  let mailTrigger = null;

  const buildMailDialog = () => {
    const d = document.createElement("dialog");
    d.className = "mail-dialog";
    d.setAttribute("aria-labelledby", "mail-dialog-title");
    d.innerHTML = `
      <div class="mail-dialog-inner">
        <div class="mail-dialog-head">
          <h2 id="mail-dialog-title">E-Mail an ArtOfWalks</h2>
          <button type="button" class="mail-close" data-mail-close aria-label="Fenster schließen">${ICON_X}</button>
        </div>
        <p class="mail-dialog-lead">Betreff und Text sind vorbereitet. Wählen Sie, womit Sie schreiben.</p>
        <div class="mail-options">
          <a class="btn btn-ink" data-mail-app href="mailto:${CONTACT_EMAIL}">Mailprogramm öffnen</a>
          <a class="btn btn-line" data-mail-web="gmail" href="https://mail.google.com/" target="_blank" rel="noopener">In Gmail schreiben</a>
          <a class="btn btn-line" data-mail-web="outlook" href="https://outlook.office.com/" target="_blank" rel="noopener">In Outlook schreiben</a>
        </div>
        <div class="mail-manual">
          <p class="mail-manual-label">Oder selbst schreiben an</p>
          <p class="mail-address" data-mail-to></p>
          <p class="mail-subject">Betreff: <span data-mail-subject></span></p>
          <div class="mail-copy">
            <button type="button" class="btn btn-line btn-sm" data-mail-copy="to">Adresse kopieren</button>
            <button type="button" class="btn btn-line btn-sm" data-mail-copy="text">Betreff und Text kopieren</button>
          </div>
        </div>
      </div>`;
    document.body.append(d);

    d.addEventListener("click", (e) => {
      if (e.target === d || e.target.closest("[data-mail-close]")) d.close();
      if (e.target.closest("[data-mail-app], [data-mail-web]")) setTimeout(() => d.close(), 300);
    });
    d.addEventListener("close", () => mailTrigger?.focus());
    d.querySelectorAll("[data-mail-copy]").forEach((btn) => {
      const label = btn.textContent;
      btn.addEventListener("click", async () => {
        const ok = await copyText(btn.dataset.mailCopy === "to" ? d.dataset.to : d.dataset.text);
        btn.textContent = ok ? "Kopiert" : "Bitte von Hand markieren";
        setTimeout(() => { btn.textContent = label; }, 2000);
      });
    });
    return d;
  };

  const openMailDialog = (href, trigger) => {
    mailDialog ||= buildMailDialog();
    const m = parseMailto(href);
    const enc = encodeURIComponent;
    const q = (sel) => mailDialog.querySelector(sel);
    q("[data-mail-app]").href = href;
    q('[data-mail-web="gmail"]').href =
      `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(m.to)}&su=${enc(m.subject)}&body=${enc(m.body)}`;
    q('[data-mail-web="outlook"]').href =
      `https://outlook.office.com/mail/deeplink/compose?to=${enc(m.to)}&subject=${enc(m.subject)}&body=${enc(m.body)}`;
    q("[data-mail-to]").textContent = m.to;
    q("[data-mail-subject]").textContent = m.subject || "frei wählbar";
    mailDialog.dataset.to = m.to;
    mailDialog.dataset.text = [m.subject && `Betreff: ${m.subject}`, m.body].filter(Boolean).join("\n\n");
    mailTrigger = trigger;
    mailDialog.showModal();
  };

  if (typeof HTMLDialogElement === "function") {
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="mailto:"]');
      if (!link || link.hasAttribute("data-mail-app")) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      openMailDialog(link.getAttribute("href"), link);
    });
  }

  /* ---------- hero: the camera route draws itself into the floor plan ----------
     Everything is visible by default; the fade-ins only run with motion allowed. */
  const planSvg = document.querySelector(".plan-svg");
  if (planSvg && !reducedMotion.matches) {
    const fade = (el, dur, delay) => {
      el.style.opacity = "0";
      el.style.animation = `einblenden ${dur}s ease-out ${delay}s forwards`;
    };
    planSvg.querySelectorAll("image").forEach((img, i) => {
      [img, img.nextElementSibling].forEach((el) => fade(el, 0.6, 0.8 + i * 1.45));
    });
    planSvg.querySelectorAll("circle").forEach((dot, i) => {
      [dot, dot.nextElementSibling].forEach((el) => fade(el, 0.45, 0.7 + i * 1.45));
    });
  }

  /* ---------- example film ----------
     Both formats run while the frame is in view. Reduced motion and data saver
     start paused, the round button plays and pauses. */
  const film = document.querySelector("[data-film]");
  if (film) {
    const videos = [...film.querySelectorAll("video")];
    const toggle = film.querySelector("[data-film-toggle]");
    let userPaused = !autoplayAllowed();
    let visible = false;

    const run = () => videos.forEach((v) => {
      if (!userPaused && visible) safePlay(v);
      else if (!v.paused) v.pause();
    });
    const sync = () => {
      film.classList.toggle("is-paused", userPaused);
      toggle?.setAttribute("aria-label", userPaused ? "Film abspielen" : "Film anhalten");
    };

    toggle?.addEventListener("click", () => {
      userPaused = !userPaused;
      sync();
      run();
    });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    }, { threshold: 0.2 }).observe(film);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) videos.forEach((v) => v.pause());
      else run();
    });
    sync();
  }

  /* ---------- price calculator ----------
     Finds the cheapest honest combination for n objects a month: single
     films, Abo Starter (+ singles) or Abo Büro (+ singles). */
  const calc = document.querySelector("[data-calc]");
  if (calc) {
    const range = calc.querySelector('input[type="range"]');
    const out = {
      count: calc.querySelector("[data-calc-count]"),
      plan: calc.querySelector("[data-calc-plan]"),
      total: calc.querySelector("[data-calc-total]"),
      per: calc.querySelector("[data-calc-per]"),
      save: calc.querySelector("[data-calc-save]"),
      cta: calc.querySelector("[data-calc-cta]"),
    };
    const PRICE = { single: 199, starter: 349, office: 790 };
    const films = (k) => (k === 1 ? "1 Objekt-Film" : `${k} Objekt-Filme`);
    const planEl = (key) => document.querySelector(`[data-plan="${key}"]`);
    const buyLink = (key) => planEl(key)?.querySelector("[data-buy]");

    const update = () => {
      const n = Number(range.value);
      const options = [
        { key: "single", cost: PRICE.single * n, label: n === 1 ? "Objekt-Film" : `${n} × Objekt-Film`, cta: "Objekt-Film bestellen" },
        { key: "starter", cost: PRICE.starter + PRICE.single * Math.max(0, n - 2), label: n <= 2 ? "Abo Starter" : `Abo Starter + ${films(n - 2)}`, cta: "Starter abonnieren" },
        { key: "office", cost: PRICE.office + PRICE.single * Math.max(0, n - 5), label: n <= 5 ? "Abo Büro" : `Abo Büro + ${films(n - 5)}`, cta: "Büro abonnieren" },
      ];
      const best = options.reduce((a, b) => (b.cost < a.cost ? b : a));
      const saving = PRICE.single * n - best.cost;

      out.count.textContent = String(n);
      out.plan.textContent = best.label;
      out.total.textContent = euro(best.cost);
      out.per.textContent = euro(Math.round(best.cost / n));
      let note = saving > 0 ? `Sie sparen ${euro(saving)} im Monat gegenüber Einzelbestellung.` : "";
      if (n > 5) note += `${note ? " " : ""}Ab 6 Objekten lohnt sich auch ein Team-Kontingent.`;
      out.save.textContent = note;

      const link = buyLink(best.key);
      if (out.cta && link) {
        out.cta.href = link.href;
        out.cta.textContent = best.cta;
      }

      ["single", "starter", "office", "team"].forEach((key) => {
        planEl(key)?.classList.toggle("is-recommended", key === best.key || (key === "team" && n > 5));
      });
      range.style.setProperty("--fill", `${((n - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100}%`);
      range.setAttribute("aria-valuetext", `${n} Objekte pro Monat`);
    };

    range.addEventListener("input", update);
    update();
  }

  /* ---------- copy e-mail address ---------- */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const label = btn.querySelector("[data-copy-label]");
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.classList.add("is-done");
        if (label) label.textContent = "Kopiert";
        setTimeout(() => {
          btn.classList.remove("is-done");
          if (label) label.textContent = "Kopieren";
        }, 2000);
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    });
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
    navToggle.addEventListener("click", () => setOpen(navToggle.getAttribute("aria-expanded") !== "true"));
    mobileMenu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        navToggle.focus();
      }
    });
  }

  /* ---------- sticky buy bar ----------
     Appears once the hero is behind you, hides again over the prices, the
     closing call and the footer so it never covers what it points at. */
  const buybar = document.querySelector("[data-buybar]");
  if (buybar) {
    const hero = document.querySelector(".hero");
    const targets = [
      document.getElementById("preise"),
      document.getElementById("kontakt"),
      document.querySelector(".site-footer"),
    ].filter(Boolean);
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
      }, { threshold: 0.02 }).observe(hero);
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

  /* ---------- the ticking checklist (visible without JS) ----------
     The only scroll-triggered motion on the page: the boxes tick one by one
     when the sheet comes into view. */
  const revealables = [...document.querySelectorAll("[data-sheet]")];
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- environment watchdog ----------
     Some embedded/headless renderers never deliver IntersectionObserver
     callbacks. If IO stays silent, show everything. */
  let ioAlive = false;
  const pulse = new IntersectionObserver(() => {
    ioAlive = true;
    pulse.disconnect();
  });
  pulse.observe(document.body);
  setTimeout(() => {
    if (ioAlive) return;
    document.documentElement.classList.add("no-motion");
    revealables.forEach((el) => el.classList.add("is-in"));
  }, 1200);
})();
