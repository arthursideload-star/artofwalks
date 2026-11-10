// ArtOfWalks · Benachrichtigung bei neuem Foto-Upload (upload.html)
//
// Der Browser ruft diese Funktion nach dem Eintrag in public.upload_anfragen mit
// { id } auf. Die Funktion liest die Anfrage mit dem geheimen Schlüssel, erzeugt
// befristete Links zu den Dateien und schickt eine Mail über Resend an
// kontakt@artofwalks.com. Pro Anfrage höchstens eine Mail (benachrichtigt_am).
//
// Secrets (nur im Supabase-Dashboard unter Edge Functions → Secrets, nie im Repo):
//   RESEND_API_KEY        Resend-Schlüssel mit Sending access für artofwalks.com
// Automatisch vorhanden: SUPABASE_URL, SUPABASE_SECRET_KEYS (bzw. SUPABASE_SERVICE_ROLE_KEY)
//
// Deploy mit verify_jwt = false: Der Publishable Key ist kein JWT. Die Funktion
// prüft selbst (gültige UUID, Zeile existiert, noch nicht benachrichtigt, jünger
// als eine Stunde) und gibt nach außen keine Daten zurück.

import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "auftrag-uploads";
const EMPFAENGER = "kontakt@artofwalks.com";
const ABSENDER = "ArtOfWalks Upload <no-reply@artofwalks.com>";
const LINK_GUELTIG_SEKUNDEN = 7 * 24 * 60 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const ERLAUBTE_URSPRUENGE = [
  "https://artofwalks.com",
  "https://www.artofwalks.com",
];
const istLokal = (origin: string) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

const corsHeader = (origin: string | null): HeadersInit => {
  const erlaubt = origin && (ERLAUBTE_URSPRUENGE.includes(origin) || istLokal(origin));
  return {
    "Access-Control-Allow-Origin": erlaubt ? origin : ERLAUBTE_URSPRUENGE[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
};

const antwort = (origin: string | null, status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeader(origin), "Content-Type": "application/json" },
  });

const geheimerSchluessel = (): string | undefined => {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (keys.default) return keys.default;
  } catch (_) { /* fällt auf den alten Schlüssel zurück */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

type Anfrage = {
  id: string;
  created_at: string;
  art: "probevideo" | "auftrag";
  maklerbuero: string;
  ansprechpartner: string;
  email: string;
  telefon: string | null;
  inserat_link: string | null;
  objekt: string;
  energieausweis: string | null;
  hinweise: string | null;
  anzahl_fotos: number;
  mit_logo: boolean;
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeader(origin) });
  if (req.method !== "POST") return antwort(origin, 405, { status: "methode" });

  let id = "";
  try {
    const body = await req.json();
    id = String(body?.id ?? "").toLowerCase();
  } catch (_) { /* leer */ }
  if (!UUID.test(id)) return antwort(origin, 400, { status: "ungueltig" });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn(`RESEND_API_KEY fehlt, keine Mail für Upload ${id}`);
    return antwort(origin, 202, { status: "nicht_eingerichtet" });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = geheimerSchluessel();
  if (!url || !key) return antwort(origin, 500, { status: "konfiguration" });
  const admin = createClient(url, key, { auth: { persistSession: false } });

  // Zeile atomar als benachrichtigt markieren, damit pro Anfrage nur eine Mail geht.
  const eineStundeZurueck = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: anfrage, error: fehler } = await admin
    .from("upload_anfragen")
    .update({ benachrichtigt_am: new Date().toISOString() })
    .eq("id", id)
    .is("benachrichtigt_am", null)
    .gte("created_at", eineStundeZurueck)
    .select()
    .maybeSingle<Anfrage>();
  if (fehler) {
    console.error("Lesen fehlgeschlagen", fehler);
    return antwort(origin, 500, { status: "fehler" });
  }
  // Unbekannt, zu alt oder schon benachrichtigt: nach außen gleiche Antwort.
  if (!anfrage) return antwort(origin, 200, { status: "ok" });

  // Dateien auflisten und befristete Links erzeugen
  const dateien: { ordner: string; name: string; url: string | null }[] = [];
  for (const ordner of ["fotos", "logo"]) {
    const { data: liste } = await admin.storage.from(BUCKET).list(`${id}/${ordner}`, {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });
    const pfade = (liste ?? []).map((d) => `${id}/${ordner}/${d.name}`);
    if (!pfade.length) continue;
    const { data: links } = await admin.storage.from(BUCKET).createSignedUrls(pfade, LINK_GUELTIG_SEKUNDEN);
    pfade.forEach((p, i) => dateien.push({
      ordner,
      name: p.split("/").pop()!,
      url: links?.[i]?.signedUrl ?? null,
    }));
  }

  const artText = anfrage.art === "probevideo" ? "Probevideo" : "Bezahlter Auftrag";
  const zeilen: [string, string | null][] = [
    ["Art", artText],
    ["Maklerbüro", anfrage.maklerbuero],
    ["Ansprechpartner", anfrage.ansprechpartner],
    ["E-Mail", anfrage.email],
    ["Telefon", anfrage.telefon],
    ["Objekt", anfrage.objekt],
    ["Inserat", anfrage.inserat_link],
    ["Energieausweis", anfrage.energieausweis],
    ["Hinweise", anfrage.hinweise],
    ["Fotos", String(anfrage.anzahl_fotos)],
    ["Logo", anfrage.mit_logo ? "ja" : "nein"],
    ["Upload-ID", anfrage.id],
  ];
  const sichtbar = zeilen.filter(([, v]) => v);

  const text = [
    `Neuer Foto-Upload (${artText})`,
    "",
    ...sichtbar.map(([k, v]) => `${k}: ${v}`),
    "",
    `Dateien (Links ${LINK_GUELTIG_SEKUNDEN / 86400} Tage gültig):`,
    ...dateien.map((d) => `${d.ordner}/${d.name}: ${d.url ?? "(kein Link)"}`),
    "",
    `Supabase: Storage → ${BUCKET} → ${id}`,
    "Antworten geht direkt an den Makler (Reply-To).",
  ].join("\n");

  const html = `<!doctype html><html lang="de"><body style="font-family:system-ui,sans-serif;color:#1d1a17">
<h2 style="margin:0 0 12px">Neuer Foto-Upload: ${esc(artText)}</h2>
<table style="border-collapse:collapse">${sichtbar.map(([k, v]) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#6b625a;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}</table>
<h3 style="margin:20px 0 8px">Dateien (Links ${LINK_GUELTIG_SEKUNDEN / 86400} Tage gültig)</h3>
<ol>${dateien.map((d) => `<li>${d.url ? `<a href="${esc(d.url)}">${esc(d.ordner)}/${esc(d.name)}</a>` : `${esc(d.ordner)}/${esc(d.name)}`}</li>`).join("")}</ol>
<p style="color:#6b625a">Supabase: Storage → ${esc(BUCKET)} → ${esc(id)}<br>Antworten geht direkt an den Makler (Reply-To).</p>
</body></html>`;

  const betreff = `Upload ${artText}: ${anfrage.maklerbuero} – ${anfrage.objekt}`.slice(0, 180);

  const resend = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `upload-${id}`,
    },
    body: JSON.stringify({
      from: ABSENDER,
      to: [EMPFAENGER],
      reply_to: anfrage.email,
      subject: betreff,
      text,
      html,
    }),
  });

  if (!resend.ok) {
    console.error("Resend-Fehler", resend.status, await resend.text());
    // Markierung zurücknehmen, damit ein erneuter Aufruf es noch einmal versucht.
    await admin.from("upload_anfragen").update({ benachrichtigt_am: null }).eq("id", id);
    return antwort(origin, 502, { status: "mail_fehler" });
  }

  return antwort(origin, 200, { status: "ok" });
});
