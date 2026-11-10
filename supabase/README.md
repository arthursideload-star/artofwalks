# Supabase: Foto-Upload

Gehört zu `upload.html` und `js/upload.js`. Projekt `xkmbdntdihoioqentofx` (Frankfurt).

| Datei | Inhalt |
|---|---|
| `migrations/20261110120000_foto_upload.sql` | Privater Bucket `auftrag-uploads` (25 MB pro Datei, nur JPG/PNG/WebP/HEIC), Insert-only-Policy für anon, Tabelle `public.upload_anfragen` (nur einfügen), Hilfsfunktionen im Schema `upload_intern` |
| `functions/upload-benachrichtigung/index.ts` | Edge Function: Mail an kontakt@artofwalks.com über Resend, mit 7 Tage gültigen Links zu den Fotos |

## Einrichten

Stand 10.11.2026: Schritt 1 und 2 sind im Projekt erledigt (Migration `foto_upload`, Function Version 1). Offen ist Schritt 3.

1. **Migration anwenden:** Inhalt der SQL-Datei im Dashboard unter *SQL Editor* ausführen (oder `supabase db push`). Sie ist rein additiv.
2. **Edge Function deployen** mit `verify_jwt = false` (der Publishable Key ist kein JWT; die Funktion prüft selbst):
   `supabase functions deploy upload-benachrichtigung --no-verify-jwt --project-ref xkmbdntdihoioqentofx`
3. **Resend-Schlüssel als Secret eintragen:** Bei Resend unter *API Keys* einen Schlüssel mit *Sending access* für `artofwalks.com` anlegen und im Supabase-Dashboard unter *Edge Functions → Secrets* als `RESEND_API_KEY` speichern. Der Schlüssel kommt nie ins Repo.

Ohne Schritt 3 funktioniert der Upload trotzdem; es kommt nur keine Mail. Uploads ohne Mail findet man mit
`select * from public.upload_anfragen where benachrichtigt_am is null order by created_at desc;`

## Grenzen gegen Missbrauch

- anon darf nur hochladen und eintragen, nichts lesen, auflisten, überschreiben oder löschen.
- Pfad muss `<uuid>/fotos/<name>.<endung>` oder `<uuid>/logo/<name>.<endung>` sein.
- Höchstens 30 Fotos und 1 Logo pro Anfrage, Ordner nur 2 Stunden offen, nach dem Absenden geschlossen.
- Höchstens 300 neue Dateien pro Stunde im ganzen Bucket (Notbremse).
- Eine Anfrage-Zeile nur, wenn im Ordner mindestens ein Foto liegt; pro Anfrage höchstens eine Mail.
- Im Formular: Honeypot-Feld und Mindestzeit von 3 Sekunden.

## Pflege

- Fotos nach den Fristen aus `legal.html`, Abschnitt 10, löschen (Dashboard → Storage → `auftrag-uploads` → Ordner der Anfrage). SQL-Löschen in `storage.objects` ist gesperrt, es geht nur über Dashboard oder Storage-API.
- Free-Plan: 1 GB Speicher insgesamt. Fotos nach dem Herunterladen löschen oder auf Pro wechseln.
