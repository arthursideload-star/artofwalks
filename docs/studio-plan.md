# ArtOfWalks Studio — Research & Bauplan

Stand: 14.10.2026. Zweck: Grundlage für den Start mit Claude Code (Opus 5.5) auf dem
eigenen PC (RTX 5090, 16 GB RAM). Alles, was ich nicht selbst geprüft habe, ist als
**[ungeprüft]** markiert.

---

## 1. Ziel

Zwei Dinge in einer Umgebung, bedient über einen Claude-Code-Chat (später optional ein
kleines deutsches Overlay):

- **A – Walkthrough-Studio:** Ordner mit 20–60 Airbnb-Fotos → Claude wählt aus, ordnet,
  plant Kamerafahrten, erzeugt Clips, prüft sie, schneidet ein 16:9-Video.
- **B – Marketing-Studio:** Werbevideos (Motion Graphics, Hooks, Vorher/Nachher,
  KI-Stimme) für ArtOfWalks selbst, Englisch und Deutsch.

Prinzipien:
1. **Erst lokal und kostenlos, dann bezahlt.** Jeder Clip geht zuerst durch die
   billigste Stufe, die gut genug ist.
2. **Nie Inhalt erfinden.** Räume, Möbel, Fenster dürfen sich nicht ändern (Airbnb,
   Recht, Kundenvertrauen).
3. **Mensch prüft am Anfang alles.** Automatisierung erst, wenn die Qualität stabil ist.
4. **Kostenlimit pro Auftrag**, hart im Code.

---

## 2. Was die Research ergeben hat

### 2.1 Wie "Claude erzeugt Pixel" wirklich funktioniert
Claude schreibt Code (HTML/CSS/GSAP). Ein Browser rendert Frames, FFmpeg macht ein MP4
daraus. Das taugt für Typografie, UI, Formen, Partikel (Tab B). Eine Kamerafahrt in
einen Raum, der im Foto nur teilweise zu sehen ist, braucht ein **Videomodell**. Claude
selbst kann nicht durch Beispiele trainiert werden; lernen geht über Dateien (Skills,
Rezepte, Bewertungsliste).

### 2.2 Foto → Kamerafahrt: die drei Wege

| Weg | Beispiele | Kosten | Stärke | Schwäche |
|---|---|---|---|---|
| **2.5D-Parallax** (Tiefenkarte + virtuelle Kamera) | DepthFlow, Depth Anything V2 | 0 € | nichts wird erfunden, schnell | nur kleine Bewegungen |
| **Lokale Videomodelle** | Wan 2.2 (Apache-2.0), LTX-2.x | 0 € (Strom) | echte Bewegung, Raum-zu-Raum mit First/Last-Frame | schwächer als Kling/Veo, Minuten pro Clip |
| **Bezahlte Modelle** | Kling 3.0, Seedance, Veo 3.1 | siehe 2.6 | beste Qualität | Kosten, Halluzinationen |

### 2.3 Lizenz-Fallen (wichtig, weil kommerziell und in Deutschland)

| Ding | Befund | Folge |
|---|---|---|
| **Apple SHARP** (ml-sharp) | Code ok, aber **Modellgewichte nur "Research Purposes", keine kommerzielle Nutzung** (LICENSE_MODEL) | **Nicht verwenden.** Vorher von mir empfohlen, das war ein Fehler. |
| **HunyuanVideo** (Tencent) | Lizenz schließt **EU, UK, Südkorea** aus ("Territory") | **Nicht verwenden** (Deutschland). [aus Suchergebnissen, Lizenztext selbst prüfen] |
| **Depth Anything V2** | nur **Small = Apache-2.0**; Base/Large/Giant = CC-BY-NC (nicht kommerziell) | nur Small nutzen. **Depth Anything 3:** Lizenz **[ungeprüft]** |
| **DepthFlow** | Code **AGPL-3.0** | für interne Nutzung ok; nie als Dienst für Dritte anbieten ohne Prüfung |
| **Wan 2.2** | Apache-2.0 | ok |
| **LTX-2.x** | Community-Lizenz: kommerziell frei **unter 10 Mio. $ Jahresumsatz** (Gruppe) | ok für dich; Text vor Nutzung lesen |
| **HyperFrames** | Apache-2.0, 63k Sterne, aktiv (Push heute) | ok |
| **ai-toolkit** (LoRA-Training) | MIT | ok |
| **ElevenLabs Free** | **keine kommerzielle Lizenz** im Free-Plan | für Ads bezahlter Plan oder lokale Stimme |

### 2.4 Abacus (deine Credits)
- Die RouteLLM-Seite listet **Video: Seedance 2.5, Kling 3.0, Veo 3.1**, dazu LLMs inkl.
  Opus 5.5. Der Endpunkt ist OpenAI-kompatibel (`https://routellm.abacus.ai/v1`), Key
  kommt mit ChatLLM Teams (10 $/Monat, 20k Credits inklusive).
- **Ungeklärt:** Die Hilfeseiten sagen, Video läuft über "Abacus AI Studio". Eine
  dokumentierte API für Bild-zu-Video habe ich **nicht** gefunden. → **Test 1 in Phase 0.**
- Fallbacks: Kling direkt (offizielle API) oder fal.ai; oder Abacus Studio von Hand für
  Hero-Shots (Clip dort erzeugen, in den Ordner legen).

### 2.5 Wie gute Walkthroughs entstehen (Runway-Leitfaden, Aug 2026)
- **Fotos auswählen:** nur Bilder mit Fluchtpunkt/Tiefe (Flur, Tür, Raum leicht schräg).
  Frontale Wandfotos verzerren. Widersprüchliches Licht aussortieren.
- **Menge:** 15–25 Fotos → 8–10 Clips → 60–90 s Film. Clips 2–4 s im Schnitt (5 s
  generieren, kürzen).
- **Die drei Fehler, die nach Diashow aussehen:** (1) Licht wechselt zwischen Clips,
  (2) Fahrtrichtung kippt, (3) Reihenfolge ignoriert den Grundriss.
- **Reihenfolge:** Außen → Eingang → Wohnen → Küche → Essen → Schlafzimmer (+Bad) →
  weitere Zimmer → Außenbereich. Bäder neben ihren Zimmern.
- **Prompt-Formel:** `[Kamerabewegung] + [Fahrtrichtung] + [was unverändert bleibt] + [Licht]`,
  z. B. "Slow dolly forward through the doorway into the kitchen, continuing left to
  right, cabinetry and fixtures unchanged, mid-morning light from the east windows."
- **Schnitt:** auf der Bewegung schneiden, harte Schnitte oder kurze Blenden, keine
  Wipes/Spins. Vor dem Schnitt hochskalieren, wenn nötig.
- **Wann lieber echtes Filmmaterial:** bewohnte Unterkunft, ungewöhnlicher Grundriss
  (Modell erfindet Geometrie), alte Fotos.

### 2.6 Kosten pro Sekunde Video (Bezahlmodelle, Oktober 2026)
- **Kling 3.0 offiziell:** 0,084 $/s (720p, ohne Audio), 0,112 $/s (1080p), 4K 0,42 $/s.
  Kling 3.0 Turbo mit Audio 0,112–0,14 $/s.
- **fal.ai:** Kling v3 Pro/Standard Bild-zu-Video 0,14 $/s; v2.6 0,07 $/s; V2.5-Turbo
  Standard 0,042 $/s.
- **Seedance 2.0** ca. 0,30 $/s (720p), **Veo 3.1 Fast** ca. 0,10–0,15 $/s.
- **Rechenbeispiel Full Walkthrough:** 10 Clips × 5 s × 0,084 $ ≈ **4 $**; mit
  2 Versuchen pro Clip ≈ 8 $. Bei 749 € Verkaufspreis unkritisch; bei einem 50-€-Einzelclip
  (1 Clip) trotzdem nur ca. 0,5–1 $.
- Lokal (Wan/LTX auf der 5090): 0 € pro Clip. Ein Reddit-Nutzer berichtet ca. 40 s für
  81 Frames mit Wan 2.2 + LoRA auf einer 5090 **[Einzelaussage, selbst messen]**.

### 2.7 Konkurrenz (gleiche Idee, viele Anbieter)
VideoTour.ai (60 Fotos, "erstes Video gratis", 10.000+ Hosts), PropertyVideos.ai
(ab 49 $, 10er-Pack 390 $), AICasa (24,99 €/Monat für 10 Videos), StagerAI, ListingAI,
Zvid, HeyGen Video Agent. **Folge:** Einzelclips für ~40–50 € sind ein Massenmarkt. Dein
Vorteil muss **Qualität, Prüfung durch Menschen und Service** sein, nicht der Preis.
Preise stammen aus Suchsnippets **[ungeprüft]**.

### 2.8 Recht und Plattformregeln (keine Rechtsberatung)
- **Airbnb:** Hosts müssen Räume zutreffend darstellen. Airbnb lässt Inhalte entfernen,
  in denen KI Mängel versteckt oder Dinge hinzufügt, die nicht da sind. Booking.com und
  Expedia haben ähnliche Regeln. Juli 2026: Fall in Toronto mit Erstattung und
  gesperrtem Inserat.
- **EU AI Act, Art. 50:** gilt seit **2. August 2026**. KI-Inhalte, die **existierende
  Orte** zum Verwechseln echt darstellen ("Deepfake"-Definition), müssen gekennzeichnet
  werden. Übergangsfrist für maschinenlesbare Markierung der Modellanbieter bis
  2. Dezember 2026. **Folge:** Einen Hinweis standardmäßig einbauen: "KI-generiertes
  Video aus Ihren Immobilienfotos".
- **USA:** Kalifornien AB 723 verlangt Kennzeichnung digital veränderter Bilder
  (Video offen). MLS-Regeln variieren.
- **Website/AGB:** `index.html` spricht von "Cinematic Walkthrough Videos", sagt aber
  nirgends, dass sie KI-generiert sind. Das sollte mit dem Hinweis oben abgestimmt
  werden. **[Anwalt, siehe SETUP.md Punkt 5]**
- Kunden senden die Fotos selbst. Nie Fotos von fremden Inseraten ziehen.

---

## 3. Architektur

```
fotos/<kunde>/            ← du legst Ordner ab
 │
 ├─ 1 INTAKE      Opus (Vision): jedes Foto → Raumtyp, Tiefe/Fluchtpunkt, Licht, Qualität,
 │                Duplikate, Text/Wasserzeichen, "Luftbild?" → analyse.json (gecached)
 ├─ 2 SHOTLIST    Opus: Auswahl + Reihenfolge nach Grundriss-Logik + Kamerafahrt pro Foto
 │                (aus der Kamera-Bibliothek) + einheitliches Licht → shotlist.json,
 │                du gibst frei (Mensch-Gate)
 ├─ 3 GENERATE    pro Shot ein Provider, Reihenfolge der Treppe:
 │                  a) parallax25d  (Depth Anything V2 Small + eigener Renderer)
 │                  b) wan_local    (ComfyUI, Wan 2.2 I2V; FLF2V für Raum-zu-Raum)
 │                  c) kling        (Abacus oder Kling-API) nur bei Bedarf/Hero-Shot
 ├─ 4 QA          Opus schaut sich Bilderstreifen jedes Clips an + automatische Checks
 │                (Ähnlichkeit Startframe↔Foto, neue Objekte?, Flackern, Verzerrung,
 │                Licht); schlechte Clips → neu mit anderem Prompt/Provider (max. N)
 ├─ 5 STITCH      FFmpeg: Farbangleich, Schnitt auf Bewegung, 16:9, Musik (später),
 │                Endkarte mit KI-Hinweis, Export + Vorschau
 └─ 6 REVIEW      du siehst die Vorschau; Korrekturen gehen in lernnotizen.md
```

Tab B (Ads): `Konzept/Skript → HyperFrames-Komposition (Typo, Mockups, Vorher/Nachher
aus Tab A) → Stimme → Untertitel → Beat-Schnitte → Selbstkritik-Schleife → MP4`.

**Kostenwächter:** `budget.json` je Auftrag (max. Kling-Sekunden, max. Versuche); beim
Überschreiten fragt Claude zuerst.

---

## 4. Tool- und Installationsliste

### 4.1 Auf deinem PC (Pflicht)
| Tool | Zweck | Hinweis |
|---|---|---|
| **Claude Code** (lokal) | die "Software" | Abo oder API-Key |
| **Node.js 22+**, **Git**, **Python 3.11+** + **uv** | Laufzeiten | |
| **FFmpeg** (mit NVENC) | Schnitt, Encoding, Frames | |
| **ComfyUI** (aktuelle Portable-Version) | Wan 2.2 / LTX lokal | RTX 50xx braucht aktuelles PyTorch mit CUDA 12.8+; bei Fehlern Claude die Installation reparieren lassen |
| **Wan 2.2 14B I2V + FLF2V** (Comfy-Vorlagen), Lightning-4-Step-LoRA | lokale Clips | native ComfyUI-Nodes zuerst; `kijai/ComfyUI-WanVideoWrapper` (Apache-2.0) hat seit Mai keinen Push mehr, nur wenn nötig |
| **HyperFrames** | Tab B | `claude plugin marketplace add heygen-com/hyperframes` und `claude plugin install hyperframes@hyperframes` |
| **RAM-Upgrade auf 64 GB** | stabiles Laden großer Modelle | 16 GB ist der Engpass |

### 4.2 MCP-Server / Anbindungen
| Anbindung | Zweck | Status |
|---|---|---|
| **Comfy MCP** (`Comfy-Org/comfy-mcp`, lokal) | Claude startet ComfyUI-Jobs | `pip install comfy-cli comfy-mcp`; Repo jung (Juli 2026), Lizenz "other" **[prüfen]**. Alternative: `artokun/comfyui-mcp` |
| **ElevenLabs MCP** (`uvx elevenlabs-mcp`) | Stimme/Audio für Ads | Key in `.env`; bezahlter Plan für kommerzielle Nutzung |
| **Abacus RouteLLM** (OpenAI-kompatibel) | Kling/Seedance/Veo (Test nötig), optional Claude-Modelle | Key in `.env` |
| **GitHub** | Repo, Backups | ohnehin vorhanden |
| optional **Videoslash MCP** (in dieser Cloud-Sitzung verbunden) | Video-Editor/Generierung | nur falls gewünscht, braucht eigene Credits |

### 4.3 Skills / Vorlagen von GitHub
| Repo | Nutzen | Lizenz |
|---|---|---|
| `heygen-com/hyperframes` (Skills: `product-launch-video`, `motion-graphics`, `music-to-video`, `embedded-captions`) | Ads, Beat-Schnitt, Untertitel; enthält lokale Whisper-Transkription, Kokoro-TTS (54 Stimmen, 9 Sprachen; **Deutsch prüfen**), NVENC | Apache-2.0 |
| `digitalsamba/claude-code-video-toolkit` | ffmpeg-Skill, ElevenLabs/Qwen-TTS-Anbindung, Playwright | MIT |
| `charlesdove977/re-walkthrough-pro` | Raum→Kamerafahrt-Idee, Stitch-Pipeline (Vorlage, nicht kopieren: nutzt Zillow/Apify/Higgsfield) | MIT |
| `calesthio/openmontage` | Referenz-Architektur für agentische Videopipelines (nur lesen) | **AGPL-3.0**, nicht einbauen |
| `remotion-dev/skills` | optional | Remotion-Lizenz separat **[prüfen]** |
| `ostris/ai-toolkit` | späteres LoRA-Training für Wan | MIT |
| `BrokenSource/DepthFlow` | 2.5D-Parallax-Referenz/Prototyp | AGPL-3.0 (intern ok) |

### 4.4 Eigene Skills, die ich schreiben werde
- `camera-library` (Kamerafahrt-Rezepte mit Tempo, Easing, Richtung, Prompt-Bausteinen)
- `/walkthrough` (Intake → Shotlist → Generate → QA → Stitch)
- `/qa-clip` (Prüfliste + Bildstreifen-Bewertung)
- `/ad` (Tab B) und `lernnotizen.md` (deine Korrekturen)
- Referenz-Analyse: `ffmpeg` Szenenschnitte + OpenCV-Optical-Flow → Tempo/Richtung/
  Beschleunigung pro Kamerafahrt (aus deinen Drohnen- und Walkthrough-Videos)

### 4.5 Optional später (Lizenz jeweils prüfen)
Hochskalierung/Interpolation (Real-ESRGAN, RIFE, SeedVR2), Musik (lizenzfrei oder
ElevenLabs Music), Whisper (lokal), World Labs Marble (Foto → 3D-Welt, Videoexport,
Preise **[ungeprüft]**), LoRA-Training für Kamerastil.

---

## 5. Phasen mit Abnahmekriterien

**Phase 0 – Fundament (PC)**
- [ ] RAM prüfen/aufrüsten, ComfyUI läuft, Wan-2.2-I2V erzeugt 1 Clip aus 1 Foto.
- [ ] **Abacus-Test:** 1 Bild-zu-Video-Aufruf mit Kling 3.0 über den RouteLLM-Key. Ergebnis
      entscheidet: Abacus-API, Kling direkt oder manuell.
- [ ] HyperFrames rendert "Hallo Welt" als MP4 (NVENC).
- [ ] Claude Code sieht Comfy-MCP und kann einen Job starten.

**Phase 1 – Intake + Shotlist (ohne Generierung)**
- [ ] 30 Testfotos → `analyse.json` + `shotlist.json`; du bestätigst Reihenfolge und Auswahl.
- [ ] Erkennt Duplikate, Text/Wasserzeichen, Luftbilder.

**Phase 2 – Clip-Backends**
- [ ] `parallax25d`, `wan_local`, `kling` hinter einer gleichen Schnittstelle.
- [ ] Kostenwächter aktiv; Vorschau (niedrige Auflösung) vor Final-Render.

**Phase 3 – QA + Stitch (erstes fertiges Video)**
- [ ] Erstes 60–90-s-Video in 16:9 aus Testfotos, ein einheitlicher Licht-Look,
      KI-Hinweis in der Endkarte.
- [ ] Mindestens 80 % der Clips bestehen die automatische QA im ersten Versuch
      (Ziel, wird gemessen).

**Phase 4 – Lernen aus Referenzen**
- [ ] 5–10 Referenzvideos analysiert → `camera-library` v1; A/B: Videos mit und ohne
      Bibliothek, du bewertest.
- [ ] Entscheidung: LoRA-Training für Wan ja/nein.

**Phase 5 – Ads (Tab B)**
- [ ] 3 Vorlagen (Hook, Vorher/Nachher, Preis-/CTA) mit HyperFrames; Stimme entschieden;
      DE und EN.

**Phase 6 – Overlay (optional)**
- [ ] Kleines lokales Web-UI auf Deutsch: Ordner reinziehen, Shotlist freigeben,
      Vorschau, Export. Gleiche Skripte wie der Chat.

**Phase 7 – Automatisierung** erst nach stabiler Qualität.

---

## 6. Risiken
| Risiko | Gegenmaßnahme |
|---|---|
| Modell erfindet Räume/Möbel | QA-Gate, kurze Clips, Fotos mit Tiefe, nie ungeprüft ausliefern |
| Lokale Qualität zu schwach | Treppe: Kling für Problem-Shots; Abacus-Test früh |
| Abacus hat keine Video-API | Kling-API/fal oder manuelle Hero-Shots |
| Lizenz-Verstoß | Tabelle 2.3, vor Einsatz Text prüfen, `LICENSES.md` im Studio-Repo führen |
| Kennzeichnungspflicht | Endkarte + Rechnungstext + AGB-Anpassung |
| 16 GB RAM | Upgrade vor Phase 2 |
| Rate-Limits/Instabilität neuer Tools | Versionen fixieren (`package-lock`, `uv.lock`) |

---

## 7. Was ich von dir brauche
1. **Betriebssystem** (Windows/Linux) und ob Claude Code lokal schon läuft.
2. **Abacus:** RouteLLM-Key vorhanden? Was kostet dort 1 Kling-Clip (Credits)? **Key nie in
   den Chat**, nur in `.env`.
3. **Testfotos:** ein Foto-Ordner (20–50) von dir/einem Kunden mit Erlaubnis.
4. **Referenzvideos:** 5–10 Walkthroughs als Datei (Drohne außen + Innenräume).
5. **Stimme:** ElevenLabs-Konto, oder lokale Stimme testen.
6. **Entscheidung Repo:** neues privates Repo `artofwalks-studio` (empfohlen), dieses
   Repo bleibt die statische Website.
7. **Website/AGB:** Hinweis auf KI-Erstellung ergänzen? (empfohlen)

---

## 8. Startprompt für Opus 5.5 (Phase 0)

> Du bist mein Studio-Entwickler für ArtOfWalks. Lies `docs/studio-plan.md`. Ziel:
> Walkthrough-Videos aus Airbnb-Fotos, lokal auf RTX 5090 (Wan 2.2 via ComfyUI), Kling nur
> bei Bedarf. Beginne mit Phase 0: (1) prüfe mein System (OS, GPU, RAM, Node, Python, FFmpeg),
> (2) richte ComfyUI mit Wan 2.2 I2V ein und erzeuge einen Test-Clip, (3) schreibe ein
> Skript `tools/abacus_video_test.py`, das mit dem Key aus `.env` einen Kling-3.0-Bild-zu-Video-
> Aufruf versucht und mir das Ergebnis oder die Fehlermeldung zeigt, (4) installiere das
> HyperFrames-Plugin und rendere ein Test-MP4. Halte Lizenz-Tabelle 2.3 ein. Frage mich,
> bevor du Geld ausgibst.

---

## Quellen
- HyperFrames: https://github.com/heygen-com/hyperframes (Apache-2.0)
- Runway-Leitfaden Walkthroughs: https://runway.com/resources/real-estate-walkthrough-video
- Apple SHARP Lizenz: https://github.com/apple/ml-sharp/blob/main/LICENSE_MODEL
- Comfy MCP: https://docs.comfy.org/agent-tools/mcp , https://github.com/Comfy-Org/comfy-mcp
- Wan 2.2 FLF2V Workflow: https://comfy.org/workflows/video_wan2_2_14B_flf2v-7016f027bcf1/
- Kling API Preise: https://kling.ai/dev/pricing
- Abacus RouteLLM: https://abacus.ai/teams/routellm-apis
- EU AI Act Art. 50: https://artificialintelligenceact.eu/transparency-rules-article-50/
- Disclosure (HousingWire): https://www.housingwire.com/articles/ai-listing-video-disclosure-test/
- Referenz-Repo: https://github.com/charlesdove977/re-walkthrough-pro
