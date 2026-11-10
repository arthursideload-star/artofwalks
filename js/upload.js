/* ArtOfWalks · Foto-Upload (nur upload.html)

   Lädt die Fotos ohne Anmeldung direkt in den privaten Supabase-Bucket
   „auftrag-uploads“, trägt die Formulardaten in die Tabelle upload_anfragen
   ein und stößt die Benachrichtigung an kontakt@artofwalks.com an.

   Der Publishable Key darf nur hochladen und eintragen (siehe
   supabase/migrations/20261110120000_foto_upload.sql), lesen kann er nichts.
   Geheime Schlüssel gehören nie in dieses Repo. */
(() => {
  "use strict";

  const SUPABASE_URL = "https://xkmbdntdihoioqentofx.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yCMFCK-f6XOBJ_5Lgh_Z8A_i2VuYlZq";
  const BUCKET = "auftrag-uploads";
  const CONTACT = "kontakt@artofwalks.com";
  /* Fassung des Einwilligungstexts. Bei geändertem Text erhöhen. */
  const CONSENT_VERSION = "2026-11";

  const MAX_FOTOS = 30;
  const MAX_BYTES = 25 * 1024 * 1024;
  const MAX_TOTAL = 300 * 1024 * 1024;
  const PARALLEL = 3;
  const MIN_SECONDS = 3;

  const TYPES = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    heic: "image/heic", heif: "image/heif",
  };
  const LOGO_TYPES = ["jpg", "jpeg", "png", "webp"];

  const form = document.querySelector("[data-upload-form]");
  if (!form) return;

  const $ = (sel) => document.querySelector(sel);
  const statusEl = $("[data-upload-status]");
  const titleEl = $("[data-upload-title]");
  const drop = $("[data-upload-drop]");
  const fileInput = $("#up-fotos");
  const logoInput = $("#up-logo");
  const listEl = $("[data-upload-list]");
  const summaryEl = $("[data-upload-summary]");
  const progressBox = $("[data-upload-progress]");
  const bar = $("[data-upload-bar]");
  const progressText = $("[data-upload-progress-text]");
  const submitBtn = $("[data-upload-submit]");
  const doneBox = $("[data-upload-done]");
  const loadedAt = Date.now();

  /* Ausgewählte Fotos: { file, ext, key, url, item, done } */
  let fotos = [];
  /* Eine Anfrage-ID pro Absenden; bleibt bei einem erneuten Versuch gleich, damit
     schon hochgeladene Dateien nicht doppelt hochgeladen werden. */
  let anfrageId = null;
  let logoDone = false;
  let busy = false;

  const mb = (bytes) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;

  const showStatus = (text, kind = "info") => {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", kind === "error");
    statusEl.classList.toggle("is-success", kind === "success");
    statusEl.setAttribute("role", kind === "error" ? "alert" : "status");
    statusEl.hidden = !text;
  };

  const setError = (id, text) => {
    const el = document.getElementById(id);
    const field = document.querySelector(`[aria-describedby~="${id}"]`);
    if (el) { el.textContent = text || ""; el.hidden = !text; }
    if (field) {
      if (text) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }
  };

  const extOf = (name) => {
    const m = /\.([a-z0-9]+)$/i.exec(name || "");
    return m ? m[1].toLowerCase() : "";
  };

  const slug = (name) => {
    const base = (name || "foto").replace(/\.[^.]*$/, "").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      .slice(0, 60).replace(/-+$/, "");
    return base || "foto";
  };

  const uuid = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };

  /* ---------- Auswahl und Vorschau ---------- */

  const totalBytes = () => fotos.reduce((s, f) => s + f.file.size, 0);

  const renderSummary = () => {
    if (!fotos.length) { summaryEl.hidden = true; return; }
    summaryEl.hidden = false;
    summaryEl.textContent = `${fotos.length} von höchstens ${MAX_FOTOS} Fotos ausgewählt, zusammen ${mb(totalBytes())}.`;
  };

  const removeFoto = (entry) => {
    if (busy) return;
    fotos = fotos.filter((f) => f !== entry);
    if (entry.url) URL.revokeObjectURL(entry.url);
    entry.item.remove();
    renderSummary();
    setError("up-fotos-error", "");
    fileInput.focus();
  };

  const addItem = (entry) => {
    const li = document.createElement("li");
    li.className = "upload-item";

    const thumb = document.createElement("div");
    thumb.className = "upload-thumb";
    const label = document.createElement("span");
    label.className = "upload-thumb-ext";
    label.textContent = entry.ext.toUpperCase();
    thumb.append(label);
    if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(entry.ext)) {
      const img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.addEventListener("load", () => thumb.classList.add("has-img"));
      img.addEventListener("error", () => img.remove());
      entry.url = URL.createObjectURL(entry.file);
      img.src = entry.url;
      thumb.append(img);
    }

    const meta = document.createElement("div");
    meta.className = "upload-meta";
    const name = document.createElement("span");
    name.className = "upload-name";
    name.textContent = entry.file.name;
    const size = document.createElement("span");
    size.className = "upload-size";
    size.textContent = mb(entry.file.size);
    meta.append(name, size);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "upload-remove";
    remove.setAttribute("aria-label", `${entry.file.name} entfernen`);
    remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-x"/></svg>';
    remove.addEventListener("click", () => removeFoto(entry));

    li.append(thumb, meta, remove);
    entry.item = li;
    listEl.append(li);
  };

  const addFiles = (files) => {
    if (busy) return;
    const problems = [];
    for (const file of files) {
      const ext = extOf(file.name);
      if (!TYPES[ext]) { problems.push(`„${file.name}“ ist kein JPG, PNG, WebP oder HEIC.`); continue; }
      if (file.size > MAX_BYTES) { problems.push(`„${file.name}“ ist größer als 25 MB.`); continue; }
      if (file.size === 0) { problems.push(`„${file.name}“ ist leer.`); continue; }
      const key = `${file.name}|${file.size}|${file.lastModified}`;
      if (fotos.some((f) => f.key === key)) continue;
      if (fotos.length >= MAX_FOTOS) { problems.push(`Höchstens ${MAX_FOTOS} Fotos pro Objekt. Weitere Fotos schicken Sie bitte mit einem zweiten Upload oder per E-Mail.`); break; }
      if (totalBytes() + file.size > MAX_TOTAL) { problems.push(`Zusammen höchstens ${mb(MAX_TOTAL)} pro Objekt. Größere Mengen schicken Sie bitte per WeTransfer-Link an ${CONTACT}.`); break; }
      const entry = { file, ext, key, url: null, item: null, done: false };
      fotos.push(entry);
      addItem(entry);
    }
    renderSummary();
    setError("up-fotos-error", problems.join(" "));
  };

  fileInput.addEventListener("change", () => {
    addFiles([...fileInput.files]);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((type) => drop.addEventListener(type, (e) => {
    e.preventDefault();
    if (!busy) drop.classList.add("is-over");
  }));
  ["dragleave", "drop"].forEach((type) => drop.addEventListener(type, (e) => {
    e.preventDefault();
    if (type === "dragleave" && drop.contains(e.relatedTarget)) return;
    drop.classList.remove("is-over");
  }));
  drop.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files) addFiles([...e.dataTransfer.files]);
  });
  /* Fotos, die neben das Feld fallen, sollen nicht die Seite ersetzen. */
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => e.preventDefault());

  logoInput.addEventListener("change", () => {
    const file = logoInput.files[0];
    let msg = "";
    if (file && !LOGO_TYPES.includes(extOf(file.name))) msg = "Bitte ein Logo als PNG, JPG oder WebP wählen. Ein SVG-Logo schicken Sie bitte per E-Mail.";
    else if (file && file.size > MAX_BYTES) msg = "Das Logo ist größer als 25 MB.";
    if (msg) logoInput.value = "";
    const logoName = document.querySelector("[data-logo-name]");
    if (logoName) logoName.textContent = logoInput.files[0] ? logoInput.files[0].name : "Keine Datei ausgewählt";
    setError("up-logo-error", msg);
    logoDone = false;
  });

  /* Fehlermeldung eines Feldes verschwindet, sobald es geändert wird. */
  form.addEventListener("input", (e) => {
    const ids = (e.target.getAttribute("aria-describedby") || "").split(" ");
    ids.filter((id) => id.endsWith("-error") && id !== "up-fotos-error").forEach((id) => setError(id, ""));
  });

  /* Art aus der Adresse vorwählen: upload.html?art=auftrag */
  const artParam = new URLSearchParams(window.location.search).get("art");
  if (artParam === "auftrag" || artParam === "probevideo") {
    form.querySelector(`input[name="art"][value="${artParam}"]`).checked = true;
  }

  /* ---------- Prüfen ---------- */

  const val = (name) => (form.elements[name].value || "").trim();

  const validate = () => {
    const checks = [
      ["up-buero-error", !val("maklerbuero") && "Bitte geben Sie Ihr Maklerbüro an."],
      ["up-name-error", !val("ansprechpartner") && "Bitte geben Sie einen Ansprechpartner an."],
      ["up-email-error", !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("email")) && "Bitte geben Sie eine gültige E-Mail-Adresse an."],
      ["up-objekt-error", !val("objekt") && "Bitte geben Sie die Objektadresse oder Objektnummer an."],
      ["up-link-error", val("inserat_link") && !/^https?:\/\/\S+\.\S+/i.test(val("inserat_link")) && "Bitte geben Sie den vollständigen Link an, beginnend mit https://."],
      ["up-fotos-error", !fotos.length && "Bitte wählen Sie mindestens ein Foto aus."],
      ["up-consent-error", !form.elements.einwilligung.checked && "Bitte bestätigen Sie, dass wir die Fotos dafür nutzen dürfen."],
    ];
    let first = null;
    for (const [id, msg] of checks) {
      if (id === "up-fotos-error" && !msg && !document.getElementById(id).hidden) continue;
      setError(id, msg || "");
      if (msg && !first) first = id;
    }
    if (first) {
      const target = first === "up-fotos-error" ? fileInput
        : document.querySelector(`[aria-describedby~="${first}"]`);
      if (target) target.focus();
      return false;
    }
    return true;
  };

  /* ---------- Hochladen ---------- */

  const headers = { apikey: SUPABASE_KEY };

  const uploadFile = (path, file, contentType, onProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader("apikey", SUPABASE_KEY);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.addEventListener("progress", (e) => { if (e.lengthComputable) onProgress(e.loaded); });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      /* Schon vorhanden: war bei einem früheren Versuch angekommen. */
      if (xhr.status === 409 || /already exists|Duplicate/i.test(xhr.responseText)) return resolve();
      const err = new Error(`Upload ${xhr.status}`);
      err.status = xhr.status;
      err.body = xhr.responseText;
      reject(err);
    });
    xhr.addEventListener("error", () => reject(new Error("Netzwerk")));
    xhr.addEventListener("abort", () => reject(new Error("Abbruch")));
    xhr.send(file);
  });

  const withRetry = async (fn) => {
    try { return await fn(); } catch (e) {
      if (e.status && e.status < 500 && e.status !== 429) throw e;
      await new Promise((r) => setTimeout(r, 1500));
      return fn();
    }
  };

  const insertAnfrage = async (row) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/upload_anfragen`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (res.ok || res.status === 409) return;
    const err = new Error(`Eintrag ${res.status}`);
    err.status = res.status;
    err.body = await res.text().catch(() => "");
    throw err;
  };

  const notify = (id) => fetch(`${SUPABASE_URL}/functions/v1/upload-benachrichtigung`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch(() => null);

  const setBusy = (on) => {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? "Wird hochgeladen …" : "Fotos hochladen und absenden";
    form.classList.toggle("is-busy", on);
    form.querySelectorAll("input, textarea, .upload-remove").forEach((el) => {
      if (el !== submitBtn) el.disabled = on;
    });
  };

  const warnLeave = (e) => { e.preventDefault(); e.returnValue = ""; };

  const showDone = () => {
    const art = form.elements.art.value;
    $("[data-upload-done-count]").textContent =
      `Wir haben ${fotos.length} ${fotos.length === 1 ? "Foto" : "Fotos"} und Ihre Angaben erhalten. Wir melden uns per E-Mail bei Ihnen.`;
    $("[data-upload-done-next]").textContent = art === "auftrag"
      ? "Innerhalb von 24 Stunden (werktags) erhalten Sie Querformat-Film und Hochkant-Reel per E-Mail."
      : "Sobald Ihr Probevideo fertig ist, schicken wir es Ihnen per E-Mail. Es ist kostenlos und unverbindlich.";
    form.hidden = true;
    doneBox.hidden = false;
    $(".upload-intro").hidden = true;
    titleEl.textContent = "Vielen Dank!";
    showStatus("");
    titleEl.focus();
  };

  const resetForm = () => {
    fotos.forEach((f) => f.url && URL.revokeObjectURL(f.url));
    fotos = [];
    listEl.textContent = "";
    anfrageId = null;
    logoDone = false;
    const keep = { maklerbuero: val("maklerbuero"), ansprechpartner: val("ansprechpartner"), email: val("email"), telefon: val("telefon") };
    const art = form.elements.art.value;
    form.reset();
    Object.entries(keep).forEach(([k, v]) => { form.elements[k].value = v; });
    form.querySelector(`input[name="art"][value="${art}"]`).checked = true;
    renderSummary();
    progressBox.hidden = true;
    doneBox.hidden = true;
    form.hidden = false;
    $(".upload-intro").hidden = false;
    titleEl.textContent = "Fotos hochladen";
    form.elements.objekt.focus();
  };
  $("[data-upload-again]").addEventListener("click", resetForm);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    showStatus("");
    if (!validate()) return;

    /* Honeypot oder unmenschlich schnell: so tun, als wäre alles gut. */
    if (val("website") || (Date.now() - loadedAt) / 1000 < MIN_SECONDS) {
      showDone();
      return;
    }

    if (!anfrageId) anfrageId = uuid();
    const logo = logoInput.files[0] || null;
    const jobs = fotos.map((f, i) => ({
      entry: f,
      size: f.file.size,
      path: `${anfrageId}/fotos/${String(i + 1).padStart(2, "0")}-${slug(f.file.name)}.${f.ext}`,
      file: f.file,
      type: TYPES[f.ext],
    }));
    if (logo) {
      const ext = extOf(logo.name);
      jobs.push({ entry: null, logo: true, size: logo.size, path: `${anfrageId}/logo/logo-${slug(logo.name)}.${ext}`, file: logo, type: TYPES[ext] });
    }

    const total = jobs.reduce((s, j) => s + j.size, 0);
    const loaded = new Map();
    jobs.forEach((j) => loaded.set(j, (j.entry && j.entry.done) || (j.logo && logoDone) ? j.size : 0));
    let doneCount = jobs.filter((j) => loaded.get(j) === j.size).length;

    const paint = () => {
      const sum = [...loaded.values()].reduce((s, n) => s + n, 0);
      const pct = total ? Math.min(100, Math.round((sum / total) * 100)) : 100;
      bar.value = pct;
      progressText.textContent = `${doneCount} von ${jobs.length} Dateien hochgeladen · ${pct} %`;
    };

    setBusy(true);
    progressBox.hidden = false;
    paint();
    window.addEventListener("beforeunload", warnLeave);

    try {
      const queue = jobs.filter((j) => loaded.get(j) < j.size);
      /* Erster Fehler stoppt die Warteschlange; laufende Uploads dürfen fertig werden. */
      let failure = null;
      const worker = async () => {
        while (queue.length && !failure) {
          const job = queue.shift();
          if (job.entry) job.entry.item.classList.add("is-uploading");
          try {
            await withRetry(() => uploadFile(job.path, job.file, job.type, (n) => { loaded.set(job, n); paint(); }));
          } catch (err) {
            failure = failure || err;
            if (job.entry) job.entry.item.classList.remove("is-uploading");
            break;
          }
          loaded.set(job, job.size);
          doneCount += 1;
          if (job.entry) {
            job.entry.done = true;
            job.entry.item.classList.remove("is-uploading");
            job.entry.item.classList.add("is-done");
          } else if (job.logo) logoDone = true;
          paint();
        }
      };
      await Promise.all(Array.from({ length: PARALLEL }, worker));
      if (failure) throw failure;

      progressText.textContent = "Angaben werden gespeichert …";
      await withRetry(() => insertAnfrage({
        id: anfrageId,
        art: form.elements.art.value,
        maklerbuero: val("maklerbuero").slice(0, 200),
        ansprechpartner: val("ansprechpartner").slice(0, 200),
        email: val("email").slice(0, 254),
        telefon: val("telefon").slice(0, 50) || null,
        inserat_link: val("inserat_link").slice(0, 500) || null,
        objekt: val("objekt").slice(0, 300),
        energieausweis: val("energieausweis").slice(0, 2000) || null,
        hinweise: val("hinweise").slice(0, 2000) || null,
        anzahl_fotos: fotos.length,
        mit_logo: Boolean(logo),
        einwilligung_fotos: true,
        einwilligung_version: CONSENT_VERSION,
      }));

      await notify(anfrageId);
      window.removeEventListener("beforeunload", warnLeave);
      setBusy(false);
      showDone();
    } catch (err) {
      window.removeEventListener("beforeunload", warnLeave);
      setBusy(false);
      fotos.forEach((f) => f.item && f.item.classList.remove("is-uploading"));
      const offline = !navigator.onLine || err.message === "Netzwerk";
      const blocked = err.status === 400 || err.status === 403 || err.status === 413;
      showStatus(offline
        ? "Die Verbindung ist abgebrochen. Bereits hochgeladene Fotos bleiben erhalten. Bitte klicken Sie noch einmal auf „Fotos hochladen und absenden“."
        : blocked
          ? `Der Upload wurde nicht angenommen. Bitte versuchen Sie es noch einmal. Klappt es nicht, schicken Sie die Fotos an ${CONTACT}.`
          : `Beim Hochladen ist etwas schiefgegangen. Bitte versuchen Sie es noch einmal. Klappt es nicht, schicken Sie die Fotos an ${CONTACT}.`,
      "error");
      if (blocked) {
        /* Neu anfangen: neue Anfrage-ID, alle Dateien noch einmal. */
        anfrageId = null;
        logoDone = false;
        fotos.forEach((f) => { f.done = false; f.item.classList.remove("is-done"); });
      }
      statusEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });
})();
