BEISPIELVIDEOS
==============

Aktuelle Belegung
-----------------

  video-3.mp4            Beispielobjekt "Landhaus", Querformat 16:9,
                         1920x1080, 12,7 s, ohne Ton, ca. 4,7 MB.
                         Ausgangsfotos KI-generiert.
                         -> Hero-Hintergrund auf Querformat-Bildschirmen
                         -> Beispiel "Landhaus", Querformat

  video-3-hochkant.mp4   Mittelausschnitt aus video-3, Hochkant 9:16,
                         608x1080, 12,7 s, ohne Ton, ca. 1,6 MB.
                         -> Hero-Hintergrund auf Hochkant-Bildschirmen (Handy)
                         -> Beispiel "Landhaus", Hochkant

  Poster: ../posters/poster-3.jpg (1280x720) und
          ../posters/poster-3-hochkant.jpg (608x1080, Sekunde 1).

Die Seite nennt die Beispiele ausdrücklich "Beispielobjekt · Ausgangsfotos
KI-generiert" und "Ausschnitt ohne Musik und Abspann". Nirgends behaupten, ein
Beispiel sei aus echten Inseratsfotos entstanden, solange das nicht stimmt.


Weiteres Beispiel hinzufügen (ohne Umbau)
-----------------------------------------

1. Querformat-Video web-tauglich kodieren (Name z. B. video-4.mp4):

     ffmpeg -i input.mp4 -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p \
       -profile:v high -level 4.0 -an -movflags +faststart video-4.mp4

2. Hochkant-Version: entweder eigene 9:16-Fassung oder Mittelausschnitt aus
   einem 1920x1080-Video:

     ffmpeg -i video-4.mp4 -vf "crop=608:1080" -c:v libx264 -crf 25 \
       -preset slow -pix_fmt yuv420p -profile:v high -level 4.0 -an \
       -movflags +faststart video-4-hochkant.mp4

   Vorher an Einzelbildern prüfen, ob der Mittelausschnitt in jeder Szene
   trägt; sonst crop=608:1080:X:0 mit eigenem X-Versatz.

3. Poster ziehen:

     ffmpeg -ss 00:00:04 -i video-4.mp4 -frames:v 1 -vf scale=1280:-2 -q:v 3 \
       ../posters/poster-4.jpg
     ffmpeg -ss 00:00:01 -i video-4-hochkant.mp4 -frames:v 1 -q:v 3 \
       ../posters/poster-4-hochkant.jpg

4. In index.html im Abschnitt "2 · BEISPIELE" den kompletten Block
   <article class="example"> ... </article> kopieren und anpassen:
   id="example-4-title" (und aria-labelledby), Titel, Hinweiszeile,
   Dateinamen von Videos und Postern, Text unter den Videos (Laufzeit).

5. Kennzeichnung:
   - Ausgangsfotos KI-generiert -> "Beispielobjekt · Ausgangsfotos KI-generiert"
   - echtes Kundenobjekt -> nur mit schriftlicher Einwilligung des Kunden
     (AGB § 11), dann z. B. "Kundenprojekt · aus den Exposé-Fotos erstellt"

-movflags +faststart ist wichtig: Der Index steht dann am Dateianfang, und die
Wiedergabe startet, bevor die ganze Datei geladen ist.

Keines der Videos hat eine Tonspur. Der Play-Button schaltet den Ton trotzdem
ein; kommt später Musik dazu, ist keine Code-Änderung nötig.


Hero-Video tauschen
-------------------

Der Hero nutzt video-3.mp4 und auf Hochkant-Bildschirmen video-3-hochkant.mp4
(Attribut data-portrait-src). Beim Tausch in index.html die <source> im Hero
anpassen und in css/styles.css die beiden Hintergrundbilder von .hero-poster.
