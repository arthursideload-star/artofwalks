# Werbevideo-Plan (HyperFrames) + Website-Upgrades

## 1. Das Video: "The Photoshoot Is Optional"

**Format:** 30 s, 1920×1080 (Website-Hero, YouTube) + 9:16-Schnitt (Reels/TikTok) aus derselben Komposition.
**Look:** dunkler Hintergrund (`#0a0a0a`) wie die Seite, Akzent Orange (`#e8711a`), Schrift wie auf der Seite (Inter). Kein Stock-Musik-Kitsch: ein ruhiger Beat, Schnitte auf den Beat.
**Ton:** Musik an, kein Sprecher nötig (Text im Bild). Optional später Voiceover.

| Zeit | Bild | Text im Bild |
|---|---|---|
| 0–3 s | Schwarz, ein Foto-Rahmen fährt rein (Standfoto aus Listing) | **"A new way for hosts."** |
| 3–7 s | Foto "erwacht": Kamerafahrt (Probeclip 1) | **"No photoshoot. No crew."** |
| 7–12 s | Preis-Vergleich: durchgestrichene Zahl links, **€749** rechts | **"A walkthrough film from the photos you already have."** |
| 12–20 s | 3 schnelle Argument-Karten, je 2–3 s, dazwischen Probeclips 2 und 3 | **"Delivered in 3 days"** · **"Works with any listing photos"** · **"Ready for Airbnb, Booking, Instagram"** |
| 20–25 s | Split-Screen: Foto links → fertiges Video rechts | **"Same photos. Completely different experience."** |
| 25–30 s | Logo + CTA, URL pulsiert | **"From €50 · artofwalks.com"** |

**Wichtig zu deinem Wunschtext:** "5, 10 oder mehr K für ein hochwertiges Video" würde ich **nicht** wörtlich sagen. Eine konkrete Konkurrenz-Zahl, die du nicht belegen kannst, kann als irreführende Werbung abgemahnt werden. Besser: *"A video shoot costs thousands."* oder *"Skip the video crew."* Ebenfalls: Du sagst "750 €", die Seite sagt **€749**: im Video exakt den Seitenpreis nehmen.

### Probeclips (brauche ich von dir)
Pro Clip: 1 Foto + 5 s Kling-Clip. Ich brauche 3 Stück, die ich im Video einsetze. Rechte-Regel: **nur eigene Fotos, vollständig KI-generierte oder lizenzfreie Bilder.**

### Technik
1. `hyperframes` ist installiert und in `.claude/settings.json` eingetragen. Relevante Skills darin: `product-launch-video`, `motion-graphics`, `slideshow`, `music-to-video`, `hyperframes-cli`.
2. Kompositionen liegen später in `video/` (HTML + GSAP), gerendert wird mit `npx hyperframes render` (braucht Node 22 und ffmpeg; ffmpeg ist hier vorhanden).
3. Ausgabe als MP4 mit `-movflags +faststart` (siehe `assets/videos/README.txt`), dann `assets/videos/ad.mp4` und Hero.

## 2. Öffentliche Beispiel-Bilder finden (rechtssicher)
- **Nicht** von Airbnb/Booking nehmen (Fotos der Hosts, urheberrechtlich geschützt, auch wenn öffentlich sichtbar).
- **Okay:** Wikimedia Commons (CC0 / CC-BY, Namensnennung beachten), Unsplash und Pexels (Lizenz prüfen, Personen/Marken im Bild beachten), eigene KI-generierte Interieurs (wie Spain Coast).
- Ich kann auf Wunsch eine Auswahl suchen und die Lizenz je Bild in `assets/CREDITS.md` festhalten.

## 3. Website: was ich ändern würde
**Sofort (Fehler/Risiko)**
1. **Sale-Datum ist abgelaufen** (`data-sale-end="2026-09-15"`, heute Oktober 2026). Die durchgestrichene €999 und das "−25 %"-Badge stehen noch. Eine Dauer-"Streichpreis"-Werbung kann als Irreführung gelten. Entweder neues Datum oder Badge und Streichpreis entfernen.
2. **Lieferzeit widerspricht sich:** Hero sagt "3 days", Schritt 3 sagt "3 to 7 days". Eine Aussage wählen.
3. **KI-Hinweis:** Das Spain-Beispiel ist KI-generiert und jetzt so beschriftet. Gleiches gilt für künftige Beispiele.

**Conversion**
4. Hero-Video durch das neue Werbevideo ersetzen (autoplay, stumm, mit Untertiteln).
5. Beispiel-Bereich wieder auffüllen (Vorher-/Nachher mit lizenzfreien Fotos), das ist der stärkste Beweis und fehlt jetzt.
6. Ein 3-Foto-Gratis-Probeclip als Lead-Magnet (E-Mail gegen Probeclip).
7. Echte Kundenstimmen erst, wenn es echte gibt. Keine erfundenen.
8. Cookie-freie Statistik (z. B. Plausible), um zu sehen, welcher Preis geklickt wird.

**Rechtliches, Geld-Garantie**
Erledigt (Oktober 2026): Die freiwillige 14-Tage-Geld-zurück-Garantie ist als Werbeaussage überall entfernt (Meta, Hero, Preise, Garantie-Block, FAQ, Danke-Seite, ehemaliger § 9 AGB). Die gesetzliche Widerrufsbelehrung in `terms.html` steht unverändert. Offen: Anwalt, IHK oder Händlerbund sollen die Widerrufsbelehrung für individuell erstellte digitale Inhalte prüfen (siehe `SETUP.md`, Abschnitt 5). Im Video deshalb keine Garantie-Aussage verwenden.
