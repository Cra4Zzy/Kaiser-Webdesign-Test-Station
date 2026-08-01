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
- `assets/sequences/portal.bin` — gebündelte 240 Frames der ersten Scrollsequenz
- `assets/sequences/studio.bin` — gebündelte 240 Frames der zweiten Scrollsequenz
- `assets/references/` — Projektbilder
- `assets/video/` — Social-Media-Reel
- `danke/` — Zielseite nach erfolgreicher Anfrage

## Vor Veröffentlichung

- Platzhalter in `impressum/index.html` durch vollständige rechtliche Angaben ersetzen.
- Platzhalter in `datenschutz/index.html` durch die vollständige Datenschutzerklärung ersetzen.
- Das Kontaktformular ist bereits mit Formspree (`xykpraze`) verbunden.

## Upload

Die 480 Animationsframes sind in nur zwei Sequenzdateien gebündelt. Dadurch
enthält das komplette Projekt weniger als 100 Dateien und kann auch mit
Upload-Oberflächen verwendet werden, die die Dateianzahl begrenzen.
