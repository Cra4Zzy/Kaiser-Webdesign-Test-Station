# Kaiser Webdesign — Cinematic Rebuild

Komplett neu entwickelte Onepage-Website mit zwei video-basierten Scroll-Filmsequenzen.

## Technischer Start

Die Seite ist statisch und kann auf jedem üblichen Webspace veröffentlicht werden. Sie funktioniert nach dem Entpacken auch direkt per Doppelklick auf `index.html`. Für eine realistische lokale Vorschau kann zusätzlich ein lokaler Webserver genutzt werden:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` im Browser öffnen.

## Struktur

- `index.html` — Hauptseite
- `assets/css/site.css` — komplettes Designsystem und responsive Layouts
- `assets/js/site.js` — Scroll-Engine, Video-Seeking und Interaktionen
- `assets/video/portal-scroll-v1.mp4` — seek-optimierter Film der ersten Scrollsequenz
- `assets/video/studio-scroll-v1.mp4` — seek-optimierter Film der zweiten Scrollsequenz
- `assets/references/` — Projektbilder
- `assets/video/` — Social-Media-Reel
- `danke/` — Zielseite nach erfolgreicher Anfrage

## Vor Veröffentlichung

- Platzhalter in `impressum/index.html` durch vollständige rechtliche Angaben ersetzen.
- Platzhalter in `datenschutz/index.html` durch die vollständige Datenschutzerklärung ersetzen.
- Das Kontaktformular ist bereits mit Formspree (`xykpraze`) verbunden.

## Upload

Die beiden Scrollfilme verwenden normale H.264-MP4-Dateien mit sehr kurzen
Keyframe-Abständen. Dadurch lassen sie sich beim Scrollen präzise ansteuern und
funktionieren zuverlässig auf normalem Webspace, Android, iOS sowie beim lokalen
Öffnen. Die Sequenz-Engine startet direkt nach dem HTML und wartet nicht mehr auf
alle übrigen Bilder und Reels. Das komplette Projekt bleibt deutlich unter 100
Dateien und eignet sich damit auch für Upload-Oberflächen mit Dateilimit.
