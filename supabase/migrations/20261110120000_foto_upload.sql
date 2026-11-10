-- Foto-Upload für Makler (upload.html)
--
-- Rein additiv: neuer Bucket, neue Policies nur für diesen Bucket, neue Tabelle,
-- neues Schema für Hilfsfunktionen. Bestehende Tabellen und Policies bleiben
-- unverändert.
--
-- Ablauf im Browser (ohne Anmeldung, Rolle anon):
--   1. Der Browser erzeugt eine zufällige UUID als Ordner pro Anfrage.
--   2. Er lädt die Fotos nach <uuid>/fotos/... und optional das Logo nach
--      <uuid>/logo/... hoch. Erlaubt ist nur INSERT, kein Lesen, Auflisten,
--      Überschreiben oder Löschen.
--   3. Er trägt die Formulardaten in public.upload_anfragen ein (nur INSERT).
--   4. Er ruft die Edge Function upload-benachrichtigung auf, die eine Mail an
--      kontakt@artofwalks.com schickt (Resend-Schlüssel nur als Secret).

-- Bucket: privat, max. 25 MB pro Datei, nur Bildformate
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'auftrag-uploads',
  'auftrag-uploads',
  false,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- Formulardaten pro Anfrage. id = Ordnername im Bucket.
create table public.upload_anfragen (
  id uuid primary key,
  created_at timestamptz not null default now(),
  art text not null check (art in ('probevideo', 'auftrag')),
  maklerbuero text not null check (char_length(maklerbuero) between 1 and 200),
  ansprechpartner text not null check (char_length(ansprechpartner) between 1 and 200),
  email text not null check (char_length(email) between 3 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefon text check (char_length(telefon) <= 50),
  inserat_link text check (char_length(inserat_link) <= 500 and inserat_link ~ '^https?://'),
  objekt text not null check (char_length(objekt) between 1 and 300),
  energieausweis text check (char_length(energieausweis) <= 2000),
  hinweise text check (char_length(hinweise) <= 2000),
  anzahl_fotos integer not null check (anzahl_fotos between 1 and 30),
  mit_logo boolean not null default false,
  einwilligung_fotos boolean not null check (einwilligung_fotos),
  einwilligung_version text not null check (char_length(einwilligung_version) <= 20),
  benachrichtigt_am timestamptz
);

comment on table public.upload_anfragen is
  'Foto-Uploads von upload.html. anon darf nur einfügen. Dateien liegen im Bucket auftrag-uploads unter <id>/.';

alter table public.upload_anfragen enable row level security;

-- anon darf nur diese Spalten setzen; created_at und benachrichtigt_am nicht.
revoke all on table public.upload_anfragen from anon, authenticated;
grant insert (id, art, maklerbuero, ansprechpartner, email, telefon, inserat_link,
              objekt, energieausweis, hinweise, anzahl_fotos, mit_logo,
              einwilligung_fotos, einwilligung_version)
  on table public.upload_anfragen to anon, authenticated;

-- Hilfsfunktionen in eigenem, nicht über die API veröffentlichtem Schema.
-- security definer, damit sie Ordner zählen können, ohne dass anon Lesezugriff
-- auf storage.objects bekommt.
create schema if not exists upload_intern;
revoke all on schema upload_intern from public;
grant usage on schema upload_intern to anon, authenticated;

-- Darf in diesen Ordner noch eine Datei? Grenzen:
--   - höchstens 30 Fotos und 1 Logo pro Anfrage
--   - der Ordner ist höchstens 2 Stunden offen (ab der ersten Datei)
--   - nach dem Absenden (Zeile in upload_anfragen) keine weiteren Dateien
--   - im ganzen Bucket höchstens 300 neue Dateien pro Stunde (Notbremse)
create or replace function upload_intern.platz_frei(ordner text, art text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from storage.objects o
      where o.bucket_id = 'auftrag-uploads'
        and o.name like ordner || '/' || art || '/%')
      < case art when 'fotos' then 30 when 'logo' then 1 else 0 end
    and not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'auftrag-uploads'
        and o.name like ordner || '/%'
        and o.created_at < now() - interval '2 hours')
    and not exists (
      select 1 from public.upload_anfragen a where a.id::text = ordner)
    and (select count(*) from storage.objects o
      where o.bucket_id = 'auftrag-uploads'
        and o.created_at > now() - interval '1 hour') < 300;
$$;

-- Liegt mindestens ein Foto im Ordner? Ohne Fotos keine Anfrage.
create or replace function upload_intern.fotos_vorhanden(ordner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from storage.objects o
    where o.bucket_id = 'auftrag-uploads'
      and o.name like ordner::text || '/fotos/%');
$$;

revoke all on function upload_intern.platz_frei(text, text) from public;
revoke all on function upload_intern.fotos_vorhanden(uuid) from public;
grant execute on function upload_intern.platz_frei(text, text) to anon, authenticated;
grant execute on function upload_intern.fotos_vorhanden(uuid) to anon, authenticated;

-- Nur hochladen, nur in diesen Bucket, nur nach dem Pfadmuster
-- <uuid>/fotos/<datei>.<endung> oder <uuid>/logo/<datei>.<endung>.
-- Es gibt bewusst keine SELECT-, UPDATE- oder DELETE-Policy: anon kann nichts
-- lesen, auflisten, überschreiben oder löschen.
create policy "auftrag-uploads: anonym nur hochladen"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'auftrag-uploads'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] in ('fotos', 'logo')
  and name ~ '^[0-9a-f-]{36}/(fotos|logo)/[a-z0-9-]{1,80}\.(jpg|jpeg|png|webp|heic|heif)$'
  and upload_intern.platz_frei((storage.foldername(name))[1], (storage.foldername(name))[2])
);

create policy "upload_anfragen: anonym nur eintragen"
on public.upload_anfragen
for insert
to anon, authenticated
with check (
  einwilligung_fotos
  and benachrichtigt_am is null
  and upload_intern.fotos_vorhanden(id)
);
-- Keine SELECT-, UPDATE- oder DELETE-Policy: lesen nur im Dashboard bzw. mit dem
-- geheimen Schlüssel (Edge Function).
