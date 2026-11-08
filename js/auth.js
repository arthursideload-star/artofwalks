/* ArtOfWalks · Kundenkonto: Anmeldung über Supabase Auth, nur auf login.html
   und konto.html geladen.

   Projektadresse und Publishable Key sind für den Browser bestimmt und geben
   keinen Zugriff auf Konten. Geheime Schlüssel gehören nie in dieses Repo. */
(() => {
  "use strict";

  const SUPABASE_URL = "https://xkmbdntdihoioqentofx.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yCMFCK-f6XOBJ_5Lgh_Z8A_i2VuYlZq";
  const MIN_PASSWORD = 10;
  const CONTACT = "kontakt@artofwalks.com";
  /* Fassung der Einwilligungstexte. Bei geänderten AGB oder Texten erhöhen. */
  const CONSENT_VERSION = "2026-11";

  const page = document.body.dataset.authPage;
  const statusEl = document.querySelector("[data-auth-status]");

  const showStatus = (text, kind = "info") => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", kind === "error");
    statusEl.classList.toggle("is-success", kind === "success");
    statusEl.setAttribute("role", kind === "error" ? "alert" : "status");
    statusEl.hidden = !text;
  };

  if (!window.supabase) {
    showStatus(`Die Anmeldung konnte nicht geladen werden. Bitte laden Sie die Seite neu oder schreiben Sie uns an ${CONTACT}.`, "error");
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      flowType: "pkce",
      storageKey: "aow-auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  const loginUrl = (modus) => {
    const url = new URL("login.html", window.location.href);
    url.search = modus ? `?modus=${modus}` : "";
    url.hash = "";
    return url.href;
  };

  const errorText = (error) => {
    const code = error && (error.code || error.name);
    const messages = {
      invalid_credentials: "E-Mail-Adresse oder Passwort stimmen nicht.",
      email_not_confirmed: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Den Link dazu haben wir Ihnen per E-Mail geschickt.",
      over_email_send_rate_limit: "Es wurden gerade zu viele E-Mails verschickt. Bitte versuchen Sie es in einigen Minuten noch einmal.",
      over_request_rate_limit: "Zu viele Versuche. Bitte warten Sie einige Minuten.",
      weak_password: `Dieses Passwort ist zu schwach. Bitte wählen Sie ein längeres mit mindestens ${MIN_PASSWORD} Zeichen.`,
      same_password: "Das neue Passwort muss sich vom bisherigen unterscheiden.",
      email_address_invalid: "Diese E-Mail-Adresse können wir nicht verwenden. Bitte prüfen Sie die Schreibweise.",
      email_address_not_authorized: `Der E-Mail-Versand ist gerade nicht möglich. Bitte melden Sie sich mit Google an oder schreiben Sie uns an ${CONTACT}.`,
      signup_disabled: `Neue Konten sind gerade nicht möglich. Bitte schreiben Sie uns an ${CONTACT}.`,
      AuthRetryableFetchError: "Keine Verbindung zum Anmeldedienst. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es noch einmal.",
    };
    return messages[code] || `Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie uns an ${CONTACT}.`;
  };

  /* Prüft ein neues Passwort gegen bekannte Datenlecks. Nur die ersten fünf
     Zeichen des SHA-1-Werts verlassen den Browser. Ist der Dienst nicht
     erreichbar, blockiert das die Anmeldung nicht. */
  const isLeakedPassword = async (value) => {
    try {
      const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value));
      const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      const res = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, { headers: { "Add-Padding": "true" } });
      if (!res.ok) return false;
      const suffix = hash.slice(5);
      return (await res.text()).split("\n").some((line) => {
        const [candidate, count] = line.trim().split(":");
        return candidate === suffix && Number(count) > 0;
      });
    } catch {
      return false;
    }
  };

  /* ---------- Login ---------- */
  const initLogin = async () => {
    const form = document.querySelector("[data-auth-form]");
    const title = document.querySelector("[data-auth-title]");
    const submit = document.querySelector("[data-auth-submit]");
    const googleBlock = document.querySelector("[data-auth-google-block]");
    const googleBtn = document.querySelector("[data-auth-google]");
    const emailField = document.querySelector("[data-auth-email-field]");
    const passwordField = document.querySelector("[data-auth-password-field]");
    const passwordLabel = document.querySelector("[data-auth-password-label]");
    const passwordHint = document.querySelector("[data-auth-password-hint]");
    const toggle = document.querySelector("[data-auth-password-toggle]");
    const modeLinks = document.querySelectorAll("[data-auth-mode]");
    const email = form.elements.email;
    const password = form.elements.password;
    const emailError = document.getElementById("auth-email-error");
    const passwordError = document.getElementById("auth-password-error");
    const consentBlock = document.querySelector("[data-auth-consent]");
    const agb = form.elements.agb;
    const werbe = form.elements.werbe;
    const agbError = document.getElementById("auth-agb-error");
    const resendBlock = document.querySelector("[data-auth-resend-block]");
    const resendBtn = document.querySelector("[data-auth-resend]");
    const resendChange = document.querySelector("[data-auth-resend-change]");
    const resendNote = document.querySelector("[data-auth-resend-note]");
    let sendAgain = null;
    let sentAgainText = "";

    const MODES = {
      anmelden: { title: "Anmelden", submit: "Anmelden", google: true, email: true, password: true, label: "Passwort", autocomplete: "current-password", hint: false, links: ["vergessen", "registrieren"] },
      registrieren: { title: "Konto anlegen", submit: "Konto anlegen", google: true, email: true, password: true, label: "Passwort wählen", autocomplete: "new-password", hint: true, consent: true, links: ["anmelden"] },
      vergessen: { title: "Passwort zurücksetzen", submit: "Link per E-Mail senden", google: false, email: true, password: false, links: ["anmelden"] },
      neu: { title: "Neues Passwort festlegen", submit: "Passwort speichern", google: false, email: false, password: true, label: "Neues Passwort", autocomplete: "new-password", hint: true, links: [] },
    };

    let mode = "anmelden";

    const setFieldError = (input, el, text) => {
      el.textContent = text;
      el.hidden = !text;
      if (text) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    };

    const clearErrors = () => {
      setFieldError(email, emailError, "");
      setFieldError(password, passwordError, "");
      setFieldError(agb, agbError, "");
    };

    const setMode = (next, { keepStatus = false, focus = false } = {}) => {
      mode = next;
      const m = MODES[next];
      title.textContent = m.title;
      document.title = `${m.title} | ArtOfWalks`;
      submit.textContent = m.submit;
      form.hidden = false;
      googleBlock.hidden = !m.google;
      emailField.hidden = !m.email;
      passwordField.hidden = !m.password;
      email.disabled = !m.email;
      password.disabled = !m.password;
      if (m.password) {
        passwordLabel.textContent = m.label;
        password.autocomplete = m.autocomplete;
        passwordHint.hidden = !m.hint;
        password.value = "";
      }
      consentBlock.hidden = !m.consent;
      resendBlock.hidden = true;
      modeLinks.forEach((link) => { link.hidden = !m.links.includes(link.dataset.authMode); });
      clearErrors();
      if (!keepStatus) showStatus("");
      if (focus) title.focus();
    };

    const validate = () => {
      clearErrors();
      const m = MODES[mode];
      /* Satzzeichen und Leerzeichen am Ende stammen fast immer vom Tippen oder Einfügen. */
      email.value = email.value.trim().replace(/[.,;]+$/, "");
      let firstInvalid = null;
      if (m.email && !email.value.trim()) {
        setFieldError(email, emailError, "Bitte geben Sie Ihre E-Mail-Adresse ein.");
        firstInvalid = email;
      } else if (m.email && !email.validity.valid) {
        setFieldError(email, emailError, "Das sieht nicht wie eine E-Mail-Adresse aus. Bitte prüfen Sie die Schreibweise.");
        firstInvalid = email;
      }
      if (m.password && !password.value) {
        setFieldError(password, passwordError, "Bitte geben Sie ein Passwort ein.");
        firstInvalid = firstInvalid || password;
      } else if (m.hint && password.value.length < MIN_PASSWORD) {
        setFieldError(password, passwordError, `Das Passwort braucht mindestens ${MIN_PASSWORD} Zeichen.`);
        firstInvalid = firstInvalid || password;
      }
      if (m.consent && !agb.checked) {
        setFieldError(agb, agbError, "Bitte akzeptieren Sie die AGB, um ein Konto anzulegen.");
        firstInvalid = firstInvalid || agb;
      }
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    };

    const setBusy = (busy) => {
      submit.disabled = busy;
      submit.textContent = busy ? "Einen Moment …" : MODES[mode].submit;
      googleBtn.disabled = busy;
    };

    /* Hilfe, falls die E-Mail nicht ankommt. Nur bei der Registrierung kann die
       Adresse falsch sein, und nur dort kann es schon eine frühere geben: Der
       Anmeldedienst übernimmt beim zweiten Versuch weder Passwort noch Häkchen. */
    const showMailHelp = (send, doneText, { signup = false } = {}) => {
      sendAgain = send;
      sentAgainText = doneText;
      resendChange.hidden = !signup;
      resendNote.hidden = !signup;
      resendBlock.hidden = false;
    };

    const confirmationMail = (address) => () => client.auth.resend({
      type: "signup",
      email: address,
      options: { emailRedirectTo: loginUrl("bestaetigt") },
    });

    /* Zeigt nach dem Versand einer E-Mail nur noch die Meldung und die nächsten Schritte. */
    const showMailSent = (text) => {
      showStatus(text, "success");
      form.hidden = true;
      googleBlock.hidden = true;
      modeLinks.forEach((link) => { link.hidden = link.dataset.authMode !== "anmelden"; });
      title.focus();
    };

    const rejectLeakedPassword = async () => {
      if (!(await isLeakedPassword(password.value))) return false;
      setFieldError(password, passwordError, "Dieses Passwort steht in bekannten Datenlecks. Bitte wählen Sie ein anderes.");
      password.focus();
      return true;
    };

    const handlers = {
      anmelden: async () => {
        const { error } = await client.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
        if (error && error.code === "email_not_confirmed") {
          const address = email.value.trim();
          showStatus(errorText(error), "error");
          showMailHelp(confirmationMail(address), `Wir haben die E-Mail an ${address} noch einmal geschickt. Das kann einige Minuten dauern.`);
          return;
        }
        if (error) return showStatus(errorText(error), "error");
        window.location.replace("konto.html");
      },
      registrieren: async () => {
        if (await rejectLeakedPassword()) return;
        const address = email.value.trim();
        const { data, error } = await client.auth.signUp({
          email: address,
          password: password.value,
          options: {
            emailRedirectTo: loginUrl("bestaetigt"),
            data: { agb_version: CONSENT_VERSION, werbe_mails: werbe.checked },
          },
        });
        if (error) return showStatus(errorText(error), "error");
        if (data.session) return window.location.replace("konto.html");
        showMailSent(`Fast geschafft: Wir haben Ihnen eine E-Mail mit einem Bestätigungslink an ${address} geschickt. Falls Sie schon ein Konto haben, melden Sie sich einfach an.`);
        showMailHelp(confirmationMail(address), `Wir haben die E-Mail an ${address} noch einmal geschickt. Das kann einige Minuten dauern. Falls Sie schon ein Konto haben, melden Sie sich einfach an.`, { signup: true });
      },
      vergessen: async () => {
        const address = email.value.trim();
        const sendLink = () => client.auth.resetPasswordForEmail(address, { redirectTo: loginUrl("neu") });
        const { error } = await sendLink();
        if (error) return showStatus(errorText(error), "error");
        showMailSent(`Wenn zu ${address} ein Konto besteht, haben wir Ihnen einen Link zum Zurücksetzen geschickt. Bitte öffnen Sie ihn im selben Browser.`);
        showMailHelp(sendLink, `Wenn zu ${address} ein Konto besteht, haben wir den Link noch einmal geschickt. Das kann einige Minuten dauern. Bitte öffnen Sie ihn im selben Browser.`);
      },
      neu: async () => {
        if (await rejectLeakedPassword()) return;
        const { error } = await client.auth.updateUser({ password: password.value });
        if (error) return showStatus(errorText(error), "error");
        window.location.replace("konto.html");
      },
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      showStatus("");
      resendBlock.hidden = true;
      if (!validate()) return;
      setBusy(true);
      try {
        await handlers[mode]();
      } catch {
        showStatus(errorText({ code: "AuthRetryableFetchError" }), "error");
      }
      setBusy(false);
    });

    [[email, emailError], [password, passwordError], [agb, agbError]].forEach(([input, el]) => {
      input.addEventListener("input", () => setFieldError(input, el, ""));
    });

    modeLinks.forEach((link) => {
      link.addEventListener("click", () => setMode(link.dataset.authMode, { focus: true }));
    });

    resendBtn.addEventListener("click", async () => {
      resendBtn.disabled = true;
      try {
        const { error } = await sendAgain();
        if (error) showStatus(errorText(error), "error");
        else showStatus(sentAgainText, "success");
      } catch {
        showStatus(errorText({ code: "AuthRetryableFetchError" }), "error");
      }
      resendBtn.disabled = false;
    });

    document.querySelector("[data-auth-resend-google]").addEventListener("click", () => googleBtn.click());
    resendChange.addEventListener("click", () => setMode("registrieren", { focus: true }));

    toggle.addEventListener("click", () => {
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      toggle.textContent = show ? "Verbergen" : "Anzeigen";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "Passwort verbergen" : "Passwort anzeigen");
    });

    googleBtn.addEventListener("click", async () => {
      showStatus("");
      setBusy(true);
      /* Ohne aktivierten Anbieter landete der Knopf auf einer rohen Fehlerseite. */
      const googleOn = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } })
        .then((res) => res.json())
        .then((settings) => settings.external && settings.external.google)
        .catch(() => true);
      if (!googleOn) {
        showStatus(`Die Anmeldung mit Google ist gerade nicht verfügbar. Bitte nutzen Sie E-Mail und Passwort oder schreiben Sie uns an ${CONTACT}.`, "error");
        setBusy(false);
        return;
      }
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: loginUrl(), queryParams: { prompt: "select_account" } },
      });
      if (error) {
        showStatus(errorText(error), "error");
        setBusy(false);
      }
    });

    /* Rückkehr von Google oder aus einem E-Mail-Link */
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const modus = query.get("modus");
    const hadCode = query.has("code");
    const urlError = query.get("error_code") || fragment.get("error_code") || query.get("error") || fragment.get("error");

    let initError = null;
    try {
      ({ error: initError } = await client.auth.initialize());
    } catch (error) {
      initError = error;
    }
    const { data: { session } } = await client.auth.getSession();

    if (session && modus === "neu") {
      setMode("neu");
    } else if (session) {
      window.location.replace("konto.html");
      return;
    } else if (urlError === "otp_expired") {
      setMode(modus === "neu" ? "vergessen" : "anmelden");
      showStatus(modus === "neu"
        ? "Dieser Link ist abgelaufen oder wurde schon benutzt. Bitte fordern Sie hier einen neuen an."
        : "Dieser Link ist abgelaufen oder wurde schon benutzt. Bitte melden Sie sich an. Ist Ihre Adresse noch nicht bestätigt, können Sie danach eine neue E-Mail anfordern.", "error");
    } else if (urlError === "access_denied") {
      showStatus("Die Anmeldung wurde abgebrochen. Sie können es jederzeit noch einmal versuchen.", "error");
    } else if (urlError) {
      showStatus(errorText({}), "error");
    } else if (hadCode && modus === "bestaetigt") {
      /* Link in einem anderen Browser geöffnet: Adresse ist bestätigt, aber
         die Sitzung gehört zum Browser, in dem das Konto angelegt wurde. */
      showStatus("Ihre E-Mail-Adresse ist bestätigt. Bitte melden Sie sich jetzt an.", "success");
    } else if (hadCode && modus === "neu") {
      setMode("vergessen");
      showStatus("Bitte öffnen Sie den Link im selben Browser, in dem Sie ihn angefordert haben, oder fordern Sie hier einen neuen an.", "error");
    } else if (modus === "neu") {
      setMode("vergessen");
    } else if (hadCode || initError) {
      showStatus("Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuchen Sie es noch einmal.", "error");
    }

    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  /* ---------- Konto ---------- */
  const initKonto = async () => {
    const konto = document.querySelector("[data-konto]");
    const gate = document.querySelector("[data-konto-gate]");
    const gateForm = document.querySelector("[data-konto-gate-form]");
    const prefs = document.querySelector("[data-konto-prefs]");
    const werbeBox = document.querySelector("[data-konto-werbe]");
    const prefsStatus = document.querySelector("[data-konto-prefs-status]");
    const toLogin = () => window.location.replace("login.html");

    const { data: { session } } = await client.auth.getSession();
    if (!session) return toLogin();

    const name = session.user.user_metadata && session.user.user_metadata.full_name;
    document.querySelector("[data-konto-email]").textContent = session.user.email || "";
    if (name) document.querySelector("[data-konto-title]").textContent = `Guten Tag, ${name}`;

    document.querySelectorAll("[data-auth-signout]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        await client.auth.signOut({ scope: "local" });
        toLogin();
      });
    });

    const saveConsent = (entries) => client.from("einwilligungen")
      .insert(entries.map(([art, erteilt]) => ({ art, erteilt, version: CONSENT_VERSION })));

    const showKonto = (werbeOn) => {
      gate.hidden = true;
      konto.hidden = false;
      prefs.hidden = false;
      werbeBox.checked = werbeOn;
      showStatus("");
    };

    /* Neueste Zeile je Art zählt. Wer sich über Google anmeldet, hat noch keine
       und bestätigt die Bedingungen hier einmalig. */
    const { data: rows, error: rowsError } = await client.from("einwilligungen")
      .select("art, erteilt").order("created_at", { ascending: false }).order("id", { ascending: false });
    if (rowsError) {
      /* Das Konto bleibt nutzbar, auch wenn die Einstellungen gerade nicht laden. */
      konto.hidden = false;
      showStatus("");
    } else {
      const latest = (art) => rows.find((row) => row.art === art);
      if (latest("agb") && latest("agb").erteilt) {
        const werbeRow = latest("werbe_mails");
        showKonto(Boolean(werbeRow && werbeRow.erteilt));
      } else {
        gate.hidden = false;
        showStatus("");
      }
    }

    gateForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const agb = gateForm.elements.agb;
      const agbError = document.getElementById("konto-agb-error");
      const submit = gateForm.querySelector("[type=submit]");
      if (!agb.checked) {
        agbError.textContent = "Bitte akzeptieren Sie die AGB, um Ihr Konto zu nutzen.";
        agbError.hidden = false;
        agb.setAttribute("aria-invalid", "true");
        agb.focus();
        return;
      }
      agbError.hidden = true;
      agb.removeAttribute("aria-invalid");
      submit.disabled = true;
      const werbeOn = gateForm.elements.werbe.checked;
      const entries = [["agb", true]];
      if (werbeOn) entries.push(["werbe_mails", true]);
      const { error } = await saveConsent(entries);
      submit.disabled = false;
      if (error) {
        agbError.textContent = `Das konnte nicht gespeichert werden. Bitte versuchen Sie es noch einmal oder schreiben Sie uns an ${CONTACT}.`;
        agbError.hidden = false;
        return;
      }
      showKonto(werbeOn);
    });

    werbeBox.addEventListener("change", async () => {
      const wanted = werbeBox.checked;
      werbeBox.disabled = true;
      const { error } = await saveConsent([["werbe_mails", wanted]]);
      werbeBox.disabled = false;
      prefsStatus.classList.toggle("is-error", Boolean(error));
      if (error) {
        werbeBox.checked = !wanted;
        prefsStatus.textContent = "Das konnte nicht gespeichert werden. Bitte versuchen Sie es noch einmal.";
      } else {
        prefsStatus.textContent = wanted ? "Gespeichert: Sie erhalten E-Mails mit Angeboten und Erinnerungen." : "Gespeichert: Sie erhalten keine E-Mails mit Angeboten und Erinnerungen mehr.";
      }
      prefsStatus.hidden = false;
    });

    client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") toLogin();
    });

    /* Die Sitzung liegt im Browser. Der Server entscheidet, ob sie noch gilt. */
    const { error } = await client.auth.getUser();
    if (error && (error.status === 401 || error.status === 403)) {
      await client.auth.signOut({ scope: "local" });
      toLogin();
    }
  };

  if (page === "login") initLogin();
  if (page === "konto") initKonto();
})();
