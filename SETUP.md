# Was vor dem Livegang noch zu tun ist

Die Seite ist fertig umgebaut, kann aber erst live gehen, wenn die Punkte 1 bis 6
erledigt sind. Bis dahin funktionieren alle Kaufbuttons trotzdem: Solange ein
Stripe-Link noch `REPLACE_` enthält, macht `js/main.js` daraus automatisch eine
vorausgefüllte Bestell-E-Mail an artofwalks@gmail.com. Gleiches gilt für den Link
„Abo verwalten“.

## 1. Kleinunternehmer-Anmeldung abwarten

Die Seite sagt an drei Stellen „Gemäß § 19 UStG wird keine Umsatzsteuer
berechnet“: unter den Preisen (`index.html`), in den AGB (`terms.html`, § 4) und
im Impressum (`legal.html`). **Erst live schalten, wenn das Finanzamt die
Kleinunternehmerregelung bestätigt hat.** Bis dahin den Branch nicht in `main`
mergen – ein Push auf `main` geht sofort live.

## 2. Drei Stripe Payment Links anlegen

| Paket       | Preis         | Abrechnung              | Platzhalter in `index.html`                  |
| ----------- | ------------- | ----------------------- | -------------------------------------------- |
| Objekt-Film | 199 €         | einmalig                | `https://buy.stripe.com/REPLACE_OBJEKT_FILM` |
| Abo Starter | 349 € / Monat | wiederkehrend, monatlich | `https://buy.stripe.com/REPLACE_ABO_STARTER` |
| Abo Büro    | 790 € / Monat | wiederkehrend, monatlich | `https://buy.stripe.com/REPLACE_ABO_BUERO`   |

Für jeden Link in Stripe einstellen:

- **E-Mail-Adresse erfassen** (ohne sie kann das Video nicht verschickt werden).
- **Firmenname erfassen** (Option „Unternehmensname“ bzw. eigenes Feld) und
  **Rechnungsadresse erfassen** – das Angebot gilt nur für Unternehmer.
- **Nach der Zahlung weiterleiten** auf `https://artofwalks.com/thanks.html`.
- **Keine Steuer** berechnen (Stripe Tax aus), Kleinunternehmer.
- Beim Objekt-Film: **Rechnung nach der Zahlung erstellen** einschalten. Abos
  erzeugen Rechnungen automatisch.
- In Stripe unter Einstellungen → Rechnungen eine **Standard-Fußzeile** setzen:
  „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.“ (Pflichthinweis auf
  Rechnungen von Kleinunternehmern.)
- Empfohlen: in den öffentlichen Unternehmensdaten die AGB-URL
  `https://artofwalks.com/terms.html` hinterlegen und im Payment Link
  „Zustimmung zu den Nutzungsbedingungen verlangen“ einschalten.

Danach die drei Platzhalter in `index.html` (Abschnitt „5 · PREISE“) durch die
echten Links ersetzen. Die E-Mail-Ersatzfunktion schaltet sich dann von selbst ab.
**Jeden Button einmal klicken** und prüfen: richtiges Produkt, richtiger Betrag,
Weiterleitung auf `thanks.html`.

## 3. Kundenportal aktivieren und Link eintragen

Stripe → Einstellungen → Billing → Kundenportal:

- Portal aktivieren.
- Kündigung erlauben, **zum Ende des Abrechnungszeitraums** (so steht es auf der
  Seite und in den AGB).
- Zahlungsmethode ändern und Rechnungen ansehen erlauben.
- Optional: Wechsel zwischen Abo Starter und Abo Büro erlauben.

Dann den Login-Link des Portals (`https://billing.stripe.com/p/login/…`) kopieren
und `https://billing.stripe.com/p/login/REPLACE_KUNDENPORTAL` überall ersetzen:

| Datei         | Stellen                                       |
| ------------- | --------------------------------------------- |
| `index.html`  | Abo-Regeln unter den Preisen, Footer          |
| `terms.html`  | Footer                                        |
| `legal.html`  | Footer                                        |
| `thanks.html` | Text unter der Checkliste, Footer             |

Schnell finden: nach `REPLACE_` suchen.

## 4. Alte Payment Links deaktivieren

Die vier Links der alten Pakete in Stripe unter Payment Links
**deaktivieren** (nicht löschen, damit die Historie bleibt):

| Link-Endung | altes Paket      |
| ----------- | ---------------- |
| `…7g400`    | Single Clip, 50 €     |
| `…7g401`    | 5 Clip Pack, 200 €    |
| `…7g403`    | 10 Clip Pack, 399 €   |
| `…7g402`    | Full Walkthrough, 749 € |

## 5. Rechtstexte anwaltlich prüfen lassen

- `terms.html` ist als **Entwurf** markiert (Kommentar ganz oben). Besonders
  prüfen lassen: Vertragsschluss über Stripe, Übertragung und Verfall im Abo,
  Objekttreue-Garantie neben den Mängelrechten, Pflicht zur KI-Kennzeichnung,
  Nutzungsrechte, Haftung, ob ein Auftragsverarbeitungsvertrag nötig ist.
- Mitprüfen: Abschnitt „Rechtssicher vermarkten“ und die FAQ zu KI-Kennzeichnung,
  ImmoScout24 und Energieausweis in `index.html`.

## 6. Platzhalter in der Datenschutzerklärung füllen

In `legal.html` stehen drei HTML-Kommentare „VOM BETREIBER ZU PRÜFEN“:

- **Abschnitt 8 (KI-Dienste):** tatsächliche Anbieter mit Sitz eintragen
  (Platzhalter `[Luma AI, Inc., USA]` und `[weitere Anbieter …]`), Grundlage der
  Übermittlung in die USA, ob der Anbieter die Fotos zum Training nutzt und wie
  lange er sie speichert.
- **Abschnitt 7:** stimmt, dass das Postfach bei Gmail liegt?
- **Abschnitt 9:** Speicherfristen (12 Monate für Fotos/Videos, 6 Monate für
  Probevideo-Anfragen) sind Vorschläge – bestätigen oder ändern.

## 7. Abläufe, die Stripe nicht abbildet

- **Kontingent und Übertragung im Abo** führt Stripe nicht. Pro Abo-Kunde eine
  kleine Tabelle führen: Abrechnungsmonat, Kontingent, genutzt, übertragen.
  Übertragene Objekte werden zuerst verbraucht und verfallen am Ende des
  Folgemonats.
- **Probevideo:** nur eins pro Maklerbüro – Anfragen in derselben Tabelle notieren.
- **Lieferzeit:** 24 Stunden (werktags) gilt auch, wenn ein Büro-Kunde fünf
  Objekte am selben Tag schickt. Wenn das nicht zu schaffen ist, vorher Text und
  AGB § 7 anpassen.

## 8. Annahmen, die du bestätigen solltest

- Foto-Empfehlung in FAQ und Danke-Seite: 10 bis 20 Fotos, mindestens 1920 px an
  der langen Seite.
- Badge „Beliebt“ am Abo Büro: Ohne Kunden ist das streng genommen noch nicht
  belegt. „Empfohlen“ wäre bis dahin die ehrlichere Variante.
- Das Probevideo darf laut AGB nicht veröffentlicht werden (§ 2 Abs. 5).

## Google Search Console

Als Sitemap `https://artofwalks.com/sitemap.xml` einreichen (nicht die
Startseite). Nach dem Livegang unter „URL-Prüfung“ `https://artofwalks.com/`
eingeben und „Indexierung beantragen“ klicken, damit Google die neue deutsche
Seite schnell neu einliest.

## Inhalte pflegen

Siehe [README.md](README.md).
