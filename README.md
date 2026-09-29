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
