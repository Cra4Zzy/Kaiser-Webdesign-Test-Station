# Kaiser Webdesign — Cinematic Rebuild

Komplett neu entwickelte Onepage-Website mit zwei Canvas-basierten Scroll-Filmsequenzen.

## Technischer Start

Die Seite ist statisch und kann auf jedem üblichen Webspace veröffentlicht werden. Für eine lokale Vorschau bitte einen lokalen Webserver verwenden, damit die Bildsequenzen zuverlässig geladen werden:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` im Browser öffnen.

## Struktur

- `index.html` — Hauptseite
- `assets/css/site.css` — komplettes Designsystem und responsive Layouts
- `assets/js/site.js` — Scroll-Engine, Frame-Loader und Interaktionen
- `assets/sequences/portal-01.bin` bis `portal-06.bin` — 240 Frames der ersten Scrollsequenz in sechs Ladepaketen
- `assets/sequences/studio-01.bin` bis `studio-06.bin` — 240 Frames der zweiten Scrollsequenz in sechs Ladepaketen
- `assets/references/` — Projektbilder
- `assets/video/` — Social-Media-Reel
- `danke/` — Zielseite nach erfolgreicher Anfrage

## Vor Veröffentlichung

- Platzhalter in `impressum/index.html` durch vollständige rechtliche Angaben ersetzen.
- Platzhalter in `datenschutz/index.html` durch die vollständige Datenschutzerklärung ersetzen.
- Das Kontaktformular ist bereits mit Formspree (`xykpraze`) verbunden.

## Upload

Die 480 Animationsframes sind in zwölf kompakte Sequenzpakete gebündelt. Beim
ersten Aufruf wird nur das Startpaket geladen und das erste Bild vollständig
dekodiert; die übrigen Pakete folgen anschließend im Hintergrund. Kurze
Netzwerkaussetzer werden automatisch erneut versucht. Das komplette Projekt
bleibt deutlich unter 100 Dateien und eignet sich damit auch für
Upload-Oberflächen mit Dateilimit.
