# ArtOfWalks

KI-animierte Immobilienvideos für Makler, erstellt aus den vorhandenen
Exposé-Fotos: Querformat-Film für Website und Portal, Hochkant-Reel für Social
Media. Angebot ausschließlich für Unternehmer (B2B).

Live: https://artofwalks.com/

## Vor dem Livegang

Siehe **[SETUP.md](SETUP.md)**: Stripe-Links und Kundenportal sind noch
Platzhalter (`REPLACE_…`), die AGB sind ein Entwurf, und in der
Datenschutzerklärung fehlen die Angaben zu den KI-Anbietern.

## Seiten

| Datei         | Inhalt                                              |
| ------------- | --------------------------------------------------- |
| `index.html`  | Startseite                                          |
| `thanks.html` | Bestätigung nach dem Kauf, Success-URL für Stripe   |
| `terms.html`  | AGB (B2B, Entwurf)                                  |
| `legal.html`  | Impressum und Datenschutzerklärung                  |

## Inhalte pflegen

- **Texte, Preise, FAQ:** in `index.html`. Bei Änderungen an der FAQ auch den
  `FAQPage`-Block im `<head>` anpassen, bei Preisänderungen die `Offer`-Einträge
  im `Service`-Block.
- **Beispielvideos:** `assets/videos/`, Anleitung für weitere Beispiele in
  `assets/videos/README.txt`. Jedes Beispiel ist ein eigener
  `<article class="example">`-Block im Abschnitt „2 · BEISPIELE“.
- **Poster:** `assets/posters/`, je ein Standbild pro Video.
- **Schriften:** Newsreader und Instrument Sans liegen als woff2 unter
  `assets/fonts/` (SIL Open Font License, Lizenztexte daneben). Die Seite lädt
  nichts von fremden Servern.
- **Farben und Abstände:** Variablen am Anfang von `css/styles.css`.

Statische Seite ohne Build-Schritt. Ein Push auf `main` deployt über GitHub Pages.
