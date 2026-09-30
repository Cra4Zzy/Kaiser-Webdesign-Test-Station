# Kaiser Webdesign — GitHub Launch Ready

Production build der Kaiser-Webdesign Website inklusive V9.3 Website-Customizer.

## Deployment über GitHub Pages

1. Den **Inhalt dieses Ordners** in das Root-Verzeichnis des GitHub-Repositories laden.
2. In GitHub unter **Settings → Pages** als Quelle `Deploy from a branch` wählen.
3. Branch `main` und Ordner `/ (root)` auswählen.
4. Die Custom Domain ist bereits über `CNAME` auf `www.kaiser-webdesign.de` vorbereitet.
5. Nach erfolgreicher Domain-Verknüpfung in GitHub **Enforce HTTPS** aktivieren.

## Wichtige Produktionsdateien

- `index.html` — Startseite
- `assets/` — CSS, JavaScript, Bilder, Videos und Fonts
- `danke/` — Danke-Seite nach Formularversand
- `datenschutz/` — Datenschutzerklärung
- `impressum/` — Impressum
- `robots.txt` / `sitemap.xml` — SEO-Basis
- `CNAME` — Custom Domain für GitHub Pages
- `.nojekyll` — verhindert Jekyll-Verarbeitung

## Formular

Das Kontaktformular sendet aktuell über Formspree an die bereits im Projekt hinterlegte Form-ID.

## Stand

V9.3 — breitere Seitenbereiche im Customizer, reduzierte mittlere Preview-Spalte, verbesserte Lesbarkeit und aufgeräumte Projektübersicht.

## Hero-Korrektur · 30.09.2026

- Desktop: 3840 × 2160; Handy bis 900 CSS-Pixel: 1920 × 1080.
- Aus dem vorhandenen 4K-Original neu exportiert, ohne Audio und ohne künstliche Zwischenbilder. Originalbewegung mit 30 Bildern pro Sekunde.
- Jeder Videoframe ist ein Keyframe. Dadurch kann der Browser beim Vorwärts- und Rückwärtsscrollen direkt zum gewünschten Bild springen.
- Nur ein Seek gleichzeitig; danach wird sofort die neueste Scrollposition bedient. Kein künstlicher 90-ms-Warteblock, kein endloser Renderloop.
- Eigene hochwertige Poster; keine Zoom-/Filter-Ersatzanimation und keine doppelte Video-Überblendung.
- Reduzierte Bewegung / Datensparmodus: zunächst Standbild, Animation auf Wunsch aktivierbar.
- Bei 4K-Decodierproblemen wird einmal Full HD versucht. Bei vollständigem Videoausfall bleibt das Poster und die lange Scrollstrecke entfällt.
- Auf sehr niedrigen Handyfenstern (höchstens 600 CSS-Pixel Höhe) bleibt der Hero unfixiert und zeigt ein Standbild, damit der Inhalt lesbar bleibt.

### Austausch

Den kompletten Ordnerinhalt einschließlich der beiden neuen MP4-Dateien übernehmen.
Kein Build-Schritt nötig. Große Videos am besten mit Git übertragen. Die einzelne
Desktop-Datei ist unter 100 MiB. Die restlichen Seitenbereiche wurden nicht verändert.

### Prüfung und Grenzen

Die Scroll-Steuerung wurde mit simulierten Browserereignissen auf Vorwärts/Rückwärts,
Endbild, verzögerte Dekodierung, Pause/Fortsetzen, Quellenwahl, reduzierte Bewegung,
Datensparmodus und Fehler-Fallback geprüft. Beide Videos wurden vollständig auf
Dekodierbarkeit und Keyframes geprüft. Die Browser-Vorschau war in der Arbeitsumgebung
blockiert; visuelle Layoutprüfung und reale iOS-/Android-Gerätetests stehen noch aus.

Die größere Datenmenge erhält Details, benötigt beim ersten Besuch aber entsprechend
Ladezeit. Die erzielbare Bildrate hängt von Gerät und Verbindung ab. Die Schärfe bleibt
auf die tatsächlich im Original enthaltenen Details begrenzt.

## Design-Update · 30.09.2026

- Markenfarben: frisches Lime, Cyan und Violett als gezielte Akzente.
- Paketkarten mit 18 px Radius (mobil 14 px), konsistenten Flächen und farbig
  hervorgehobener Auswahl ohne Größenwechsel.
- Einheitlicher heller Customizer mit dunkler Kopfleiste und Türkis für aktive
  Bedienelemente. Die Projektübersicht verwendet dieselben neutralen Flächen.
- Empfehlungen standardmäßig eingeklappt; Strukturmarkierungen erst auf Wunsch.
- Ruhigere Kaiser-Beispielvorschau. Eigene Farbwelten und der Dunkelmodus bleiben
  unabhängig von den Farben der Bedienoberfläche.
- Schwarze HTML/CSS-Abdeckung des AI-Schriftzugs. Die Position wird anhand der
  tatsächlich dargestellten 16:9-Videofläche berechnet, inklusive Letterboxing.
  Die Videodateien bleiben unverändert; keine weitere verlustbehaftete Kodierung.
- JS-Syntax, Scroll-Regression, Maskenposition und zentrale Textkontraste geprüft.
  Visuelle Browser- und echte Mobilgerätetests sind weiterhin ausstehend.

## Lesbarkeit & Reel · 30.09.2026

- Schrift in Seitenstruktur, Content-Check und Empfehlungen um 35 % vergrößert;
  grauer Hintergrund mit weißer Schrift. Containermaße und Abstände unverändert.
- Ergebniszeilen des Ablaufs: 12 → 15,6 px (+30 %).
- Alle Leistungsbereiche: Überschriften und Beschreibungen +20 %.
- Fahrschul-Reel durch gelieferten Friseur-Abholservice ersetzt, inklusive Poster
  und Beschriftung. Video verlustfrei umverpackt, nicht neu komprimiert.
- Hero-Pausebutton entfernt. Systemeinstellung für reduzierte Bewegung bleibt aktiv.
