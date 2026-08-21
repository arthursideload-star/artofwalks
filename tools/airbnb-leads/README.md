# ArtOfWalks Lead-Pipeline

Sucht weltweit große Airbnb-Objekte mit umfangreicher, hochauflösender Fotostrecke
und ermittelt dazu eine Telefonnummer des Gastgebers bzw. der verwaltenden Firma.
Ergebnis: `out/artofwalks-leads.csv` und `out/artofwalks-leads.xlsx`.

## Wichtig vorab: warum Telefonnummern angereichert werden müssen

Airbnb veröffentlicht **keine** Telefonnummern von Gastgebern — Kontakt läuft
ausschließlich über das interne Messaging. Die Nummer kommt daher immer aus einer
zweiten Quelle. Die Pipeline geht diese Kette der Reihe nach durch:

1. **`listing_text`** — `tel:`-Links und Nummern in der Objektbeschreibung selbst.
2. **`host_links`** — eigene Website oder Instagram, die der Host in der
   Beschreibung nennt; dort Startseite und danach Kontakt-/Impressumsseite.
3. **`web_search`** — Suchmaschinen-Lookup aus Objektname + Ort, Buchungsportale
   ausgeschlossen (deren Nummern gehören dem Portal, nicht dem Host).

Realistisch: Objekte, die von Agenturen oder Property-Managern betreut werden,
liefern fast immer eine Nummer (Impressumspflicht in der EU). Reine
Privatgastgeber ohne eigene Website oft nicht. Deshalb muss die Pipeline
deutlich mehr Listings prüfen als am Ende Leads herauskommen — plane grob mit
dem drei- bis fünffachen.

## Installation

```bash
cd tools/airbnb-leads
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
scrapling install          # einmalig: lädt den gepatchten Chromium
```

## Ausführen

```bash
python run.py                      # bis 100 Leads, alle Märkte aus config.yaml
python run.py --limit 25           # kleiner Testlauf
python run.py --markets "Mallorca, Spain" "Tyrol, Austria"
python run.py --export-only        # nur neu exportieren, was schon im Cache liegt
python run.py -v                   # ausführliches Log
```

Der Lauf ist **abbrechbar und fortsetzbar**. Jede geladene Seite landet in
`out/cache.sqlite3`; ein Neustart macht dort weiter, wo er aufgehört hat, statt
von vorn zu beginnen. Ctrl-C beendet nach dem aktuellen Listing sauber und
exportiert, was bis dahin da ist.

## Zielprofil anpassen

Alles Wesentliche steht in `config.yaml`:

| Feld | Bedeutung |
|---|---|
| `target.leads_wanted` | Anzahl fertiger Leads, bei der gestoppt wird |
| `target.require_phone` | `false` nimmt auch Objekte ohne Nummer auf (E-Mail als Fallback) |
| `listing_filters.min_photos` | Mindestgröße der Fotostrecke (aktuell 25) |
| `listing_filters.min_bedrooms` / `min_guests` | „große Häuser" (aktuell 4 / 8) |
| `listing_filters.min_photo_width` | verwirft Galerien, die Airbnb nur klein ausliefert |
| `scraping.delay_seconds` | Pause pro Host — nicht unter 2 setzen |
| `markets` | Suchregionen, nach Kontinent gruppiert |

Die Märkte werden **regionenübergreifend abwechselnd** abgearbeitet, nicht Block
für Block. Sonst kämen alle 100 Leads aus Südeuropa und Asien käme nie dran.

## Ausgabespalten

`Objekt`, `Telefon`, `Telefon-Quelle`, `E-Mail`, `Website`, `Instagram`,
`Gastgeber`, `Markt`, `Stadt`, `Land`, `Schlafzimmer`, `Gäste`, `Fotos`,
`Max. Bildbreite`, `Bewertung`, `Reviews`, `Superhost`, `Objekte des Hosts`,
`Airbnb-Link`.

`Telefon-Quelle` nennt immer die Domain, auf der die Nummer gefunden wurde —
damit ist jeder Lead vor dem Anruf nachprüfbar.

## Wie robust ist das Parsing?

Die Extraktion liest **nicht** Airbnbs HTML-Struktur, sondern das eingebettete
JSON (`<script type="application/json">`) und sucht darin nach Feldnamen. Airbnb
ändert das Markup regelmäßig, die JSON-Schlüssel deutlich seltener. Fotos werden
über die CDN-URLs gezählt und dabei nach Foto-Identität dedupliziert, damit
dieselbe Aufnahme in fünf Auflösungen nicht als fünf Bilder zählt.

Trotzdem ehrlich gesagt: **die Parser sind gegen Fixtures getestet, nicht gegen
die Live-Seite.** Der erste echte Lauf braucht wahrscheinlich Nachjustierung an
den Feldnamen. Der Testlauf dafür ist `python run.py --limit 3 -v`.

`max_photo_width` liest die größte Variante, die Airbnb ausliefert, nicht die
echte Pixelgröße der Originaldatei — das ließe sich nur mit einem zusätzlichen
Bild-Download prüfen. In der Praxis ist eine Galerie mit 1440px-/`original`-
Varianten mit einer echten Kamera fotografiert worden.

## Tests

```bash
python -m unittest discover -s tests -t .
```

23 Tests, alle offline gegen Fixtures — Foto-Zählung, Feldextraktion,
Profilfilter, Telefon-Validierung, Erkennung geteilter Plattform-Nummern sowie
ein kompletter Durchlauf Suche → Listing → Anreicherung → CSV/XLSX.

## Rechtlicher Hinweis

Airbnbs Nutzungsbedingungen untersagen automatisiertes Auslesen; die Pipeline
drosselt deshalb pro Host und cached aggressiv, aber das Risiko einer Sperre
bleibt bestehen. Telefonnummern natürlicher Personen für Kaltakquise fallen in
der EU unter DSGVO und UWG — telefonische Werbung gegenüber Privatpersonen
braucht vorherige Einwilligung, gegenüber Unternehmen genügt mutmaßliche
Einwilligung. Praktisch heißt das: **gewerbliche Gastgeber und Property-Manager
mit veröffentlichter Geschäftsnummer sind der belastbare Teil der Liste.** Die
Spalte `Objekte des Hosts` zeigt, wer das ist — ab etwa 3 Objekten ist von einem
gewerblichen Anbieter auszugehen.
