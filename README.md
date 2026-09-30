# Kaiser Webdesign – GitHub Teststation

Aktueller Stand inklusive mobiler Schriftkorrektur und aufklappbarer Paketinfos.
Für https://cra4zzy.github.io/Kaiser-Webdesign-Test-Station/ vorbereitet.

## Veröffentlichen

1. ZIP komplett entpacken. `index.html` und `assets/` müssen direkt im Repository-Hauptverzeichnis liegen. Die ZIP selbst nicht hochladen.
2. Im Repository **Add file → Upload files** öffnen. Den kompletten entpackten Inhalt einschließlich des gesamten `assets`-Ordners hochladen und committen. Gleichnamige Dateien ersetzen. Alle Einzeldateien sind kleiner als 25 MiB.
3. Falls das Repository noch eine Datei `CNAME` enthält: für diese Teststation entfernen. Unter **Settings → Pages** das Feld **Custom domain** leer lassen. Die Einstellungen deiner eigentlichen Hauptwebsite nicht ändern.
4. **Settings → Pages → Deploy from a branch → main → / (root) → Save** einstellen.
5. Den erfolgreichen Pages-Deploy abwarten, dann die Teststation mit Strg+F5 neu laden.

## Unbedingt mit hochladen

- assets/video/kaiser-scroll-desktop.mp4
- assets/video/kaiser-scroll-mobile.mp4
- assets/video/abholservice-reel.mp4
- assets/video/barber-reel-preview.mp4

Nach dem Deployment jeden dieser Pfade hinter der Teststation-URL öffnen.
Es muss ein Video erscheinen, keine 404-Seite. Ein erfolgreicher Pages-Deploy
allein garantiert nicht, dass beim Upload alle Medien übernommen wurden.

## Behobene Probleme

- Live-Prüfung am 30.09.2026: alle vier verwendeten MP4-Pfade lieferten HTTP 404.
- Desktop-Hero und Abholservice-Reel für den Browser-Upload neu komprimiert.
  Beide behalten die 4K-Auflösung; Neukomprimierung ist verlustbehaftet.
  Der Hero nutzt kurze Keyframe-Abstände von vier Bildern fürs Scroll-Seeking.
- Hero lädt beim Aktivieren ausdrücklich mit preload=auto. Zuvor blieb
  preload=none gesetzt, obwohl die Steuerung auf geladene Bilder wartete.
- Cache-Versionen aktualisiert, Hauptdomain-Zuordnung aus diesem Paket entfernt.
- Die beiden mobilen Korrekturen bleiben unverändert enthalten.

## Prüfstand

JavaScript-Syntax, lokale Dateiverweise, Upload-Dateigrößen, Videodekodierung
und Erhalt der mobilen Korrekturen wurden geprüft. Noch nicht in dein Repository
hochgeladen. Ein abschließender Test der neuen Veröffentlichung und echte
Handytests stehen aus. Der bestehende Formspree-Endpunkt wurde nicht durch
Versenden einer Nachricht getestet.

## Premium-Customizer · letztes Update

- Dunkle, einheitliche Bedienoberfläche mit gut lesbaren Kontrasten.
- Drei aufklappbare Bereiche statt einer langen Liste im ersten Schritt.
- Extras starten mit passenden Empfehlungen; Leistungsdetails sind aufklappbar.
- Doppelte Projektspalte und zusätzliche Preis-Badges entfernt.
- Mobile Vorschau öffnet erst auf Wunsch, mit Rückweg zur Auswahl.
- Größere mobile Schrift und Touch-Flächen; kein verkleinerter Desktop-Editor.
- Anfrage führt zunächst zur Zusammenfassung und dann zum Kontaktformular.
- Preise, Berechnungsmodell, Hero und Videodateien unverändert.

Funktionstests mit simuliertem Desktop-/Mobil-DOM bestanden: Auswahl bleibt beim
Aufklappen erhalten, Preisberechnung, Extras, Zusammenfassung, Vorschau-Toggle,
mobile Paketinformationen. Zentrale Textkontraste geprüft. Die visuelle Prüfung
auf realen Browsern und Geräten steht weiterhin aus.
