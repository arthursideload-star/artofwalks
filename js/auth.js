/* ArtOfWalks · Kundenkonto: Anmeldung über Supabase Auth, nur auf login.html
   und konto.html geladen.

   Projektadresse und Publishable Key sind für den Browser bestimmt und geben
   keinen Zugriff auf Konten. Geheime Schlüssel gehören nie in dieses Repo. */
(() => {
  "use strict";

  const SUPABASE_URL = "https://xkmbdntdihoioqentofx.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yCMFCK-f6XOBJ_5Lgh_Z8A_i2VuYlZq";
  const MIN_PASSWORD = 10;
  const CONTACT = "artofwalks@gmail.com";

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

    const MODES = {
      anmelden: { title: "Anmelden", submit: "Anmelden", google: true, email: true, password: true, label: "Passwort", autocomplete: "current-password", hint: false, links: ["vergessen", "registrieren"] },
      registrieren: { title: "Konto anlegen", submit: "Konto anlegen", google: true, email: true, password: true, label: "Passwort wählen", autocomplete: "new-password", hint: true, links: ["anmelden"] },
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
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    };

    const setBusy = (busy) => {
      submit.disabled = busy;
      submit.textContent = busy ? "Einen Moment …" : MODES[mode].submit;
      googleBtn.disabled = busy;
    };

    /* Zeigt nach dem Versand einer E-Mail nur noch die Meldung und den Weg zurück. */
    const showMailSent = (text) => {
      showStatus(text, "success");
      form.hidden = true;
      googleBlock.hidden = true;
      modeLinks.forEach((link) => { link.hidden = link.dataset.authMode !== "anmelden"; });
    };

    const handlers = {
      anmelden: async () => {
        const { error } = await client.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
        if (error) return showStatus(errorText(error), "error");
        window.location.replace("konto.html");
      },
      registrieren: async () => {
        const { data, error } = await client.auth.signUp({
          email: email.value.trim(),
          password: password.value,
          options: { emailRedirectTo: loginUrl("bestaetigt") },
        });
        if (error) return showStatus(errorText(error), "error");
        if (data.session) return window.location.replace("konto.html");
        showMailSent("Fast geschafft: Wir haben Ihnen eine E-Mail mit einem Bestätigungslink geschickt. Falls Sie schon ein Konto haben, melden Sie sich einfach an.");
      },
      vergessen: async () => {
        const { error } = await client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: loginUrl("neu") });
        if (error) return showStatus(errorText(error), "error");
        showMailSent("Wenn zu dieser Adresse ein Konto besteht, haben wir Ihnen einen Link zum Zurücksetzen geschickt. Bitte öffnen Sie ihn im selben Browser.");
      },
      neu: async () => {
        const { error } = await client.auth.updateUser({ password: password.value });
        if (error) return showStatus(errorText(error), "error");
        window.location.replace("konto.html");
      },
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      showStatus("");
      if (!validate()) return;
      setBusy(true);
      try {
        await handlers[mode]();
      } catch {
        showStatus(errorText({ code: "AuthRetryableFetchError" }), "error");
      }
      setBusy(false);
    });

    [[email, emailError], [password, passwordError]].forEach(([input, el]) => {
      input.addEventListener("input", () => setFieldError(input, el, ""));
    });

    modeLinks.forEach((link) => {
      link.addEventListener("click", () => setMode(link.dataset.authMode, { focus: true }));
    });

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
        : "Dieser Link ist abgelaufen oder wurde schon benutzt. Bitte melden Sie sich an.", "error");
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
    const signOutBtn = document.querySelector("[data-auth-signout]");
    const toLogin = () => window.location.replace("login.html");

    const { data: { session } } = await client.auth.getSession();
    if (!session) return toLogin();

    const name = session.user.user_metadata && session.user.user_metadata.full_name;
    document.querySelector("[data-konto-email]").textContent = session.user.email || "";
    if (name) document.querySelector("[data-konto-title]").textContent = `Guten Tag, ${name}`;
    konto.hidden = false;
    showStatus("");

    signOutBtn.addEventListener("click", async () => {
      signOutBtn.disabled = true;
      await client.auth.signOut({ scope: "local" });
      toLogin();
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
