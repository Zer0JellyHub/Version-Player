# 🎬 Jellyfin Version Selector

Ein Browser-Script-Duo, das in Jellyfin einen **„Version wählen"**-Button direkt in die Detail-Seite einfügt – für Filme und Serien/Episoden getrennt. Damit kannst du auf Knopfdruck zwischen mehreren gespeicherten Versionen einer Datei wechseln (z. B. 4K Remux, 1080p BluRay, WEB-DL), ohne neu im Menü navigieren zu müssen.

---

## 📋 Voraussetzungen

### JavaScript-Injector erforderlich

Diese Scripts laufen **nicht** von alleine. Du brauchst ein Browser-Add-on, das eigenen JavaScript-Code auf einer bestimmten Webseite automatisch ausführt. Empfohlene Add-ons:

| Add-on | Browser | Link |
|---|---|---|
| **Violentmonkey** *(empfohlen)* | Chrome, Firefox, Edge | https://violentmonkey.github.io |
| **Tampermonkey** | Chrome, Firefox, Edge, Safari | https://www.tampermonkey.net |
| **Greasemonkey** | Firefox | https://addons.mozilla.org |

> ⚠️ **Wichtig:** Das Script muss auf deine Jellyfin-URL zugreifen dürfen. Beim Anlegen des Userscripts die `@match`-Zeile entsprechend anpassen (z. B. `// @match http://192.168.1.100:8096/*`).

---

## 📁 Dateibenennung & Versionen in Jellyfin anlegen

Damit der Version Selector funktioniert und sinnvolle Namen anzeigt, müssen die Dateien **korrekt benannt und im richtigen Ordner abgelegt** werden. Jellyfin erkennt mehrere Dateien im gleichen Ordner automatisch als Versionen desselben Titels.

### 🎬 Filme

Alle Versionen eines Films kommen in **denselben Ordner** und müssen den **gleichen Filmtitel** im Dateinamen tragen. Der Teil nach dem letzten ` - ` (Leerzeichen-Bindestrich-Leerzeichen) wird als Versionsname im Selector angezeigt.

```
/movies/The Dark Knight (2008)/
    ├── The Dark Knight (2008) - Remux 4K HDR.mkv        → zeigt: "Remux 4K HDR"
    ├── The Dark Knight (2008) - BluRay 1080p.mkv         → zeigt: "BluRay 1080p"
    └── The Dark Knight (2008) - WEB-DL 1080p.mkv         → zeigt: "WEB-DL 1080p"
```

> 💡 Tipp: Nenne die Versionen so, dass du sofort weißt, was du bekommst – z. B. `Remux 4K HDR`, `BluRay 1080p x265`, `WEB-DL SDR`, `Extended Cut`, etc.

### 📺 Serien / Episoden

Gleiche Logik wie bei Filmen – die Versionen einer Episode kommen in **denselben Staffel-Ordner**. Wichtig ist, dass Episode-Nummer (S01E05) und Titel identisch sind:

```
/series/Breaking Bad/Season 01/
    ├── Breaking Bad S01E05 - BluRay 1080p.mkv            → zeigt: "BluRay 1080p"
    └── Breaking Bad S01E05 - WEB-DL 720p.mkv             → zeigt: "WEB-DL 720p"
```

### Versionen in der Jellyfin-Bibliothek zusammenführen

Falls Jellyfin die Dateien nicht automatisch zusammenfasst:
1. Jellyfin Web-UI öffnen → Adminbereich → **Bibliothek scannen**
2. Alternativ: Auf das jeweilige Film-/Serienelement gehen → `···` Menü → **Versionen zusammenführen**

---

## 🖥️ Wie es im Player aussieht

### Button in der Detail-Seite

Der Button `▤` (Video-Bibliothek-Icon) wird automatisch **neben dem Favoriten-Herz-Button** in der Buttonleiste der Detail-Seite eingefügt:

```
[ ▶ Abspielen ]  [ ⇄ ]  [ ♡ ]  [ ▤ ]  ← neu
```

> Der Button erscheint **nur**, wenn der Titel tatsächlich mehr als eine Version hat. Bei Einzelversionen bleibt die Oberfläche unverändert.

### Versions-Popup (Filme)

Beim Klick auf den Button öffnet sich ein Popup **rechts unten** auf dem Bildschirm:

```
┌─────────────────────────────────┐
│ 🎬 VERSIONEN    3 verfügbar     │
├─────────────────────────────────┤
│ ✅ Remux 4K HDR                 │  ← aktive Version (blau markiert)
│    2160p · HEVC · 58.3 GB       │
├─────────────────────────────────┤
│    BluRay 1080p                 │  ← auswählbar
│    1080p · H264 · 15.7 GB       │
├─────────────────────────────────┤
│    WEB-DL 1080p                 │
│    1080p · H265 · 8.2 GB        │
├─────────────────────────────────┤
│   ▶ Startet an gleicher Position│
└─────────────────────────────────┘
```

### Versions-Popup (Serien/Episoden)

Identische Optik, aber mit `📺` im Header statt `🎬`:

```
┌─────────────────────────────────┐
│ 📺 VERSIONEN    2 verfügbar     │
├─────────────────────────────────┤
│ ✅ BluRay 1080p                 │  ← aktiv
│    1080p · H265 · 4.8 GB        │
├─────────────────────────────────┤
│    WEB-DL 720p                  │
│    720p · H264 · 1.2 GB         │
├─────────────────────────────────┤
│   ▶ Startet an gleicher Position│
└─────────────────────────────────┘
```

---

## 📌 Metadaten im Popup

Für jede Version werden automatisch folgende Infos angezeigt (sofern von Jellyfin bereitgestellt):

- **Auflösung** – z. B. `2160p`, `1080p`, `720p`
- **Codec** – z. B. `HEVC`, `H264`, `AV1`
- **Dateigröße** – z. B. `58.3 GB`

---

## ⚡ Versionsumschaltung

- Klick auf eine Version → sofortiger Wechsel
- **Position wird beibehalten** – der neue Stream startet an der gleichen Stelle wie der aktuelle
- Ist nur eine Version vorhanden → Toast-Meldung: `ℹ Nur eine Version`
- Beim Wechsel während aktiver Wiedergabe: kurze Meldung `⏳ Wechsle...`

---

## 🚀 Installation (Schritt für Schritt)

### 1. JavaScript-Injector installieren

Installiere **Violentmonkey** oder **Tampermonkey** als Browser-Erweiterung (siehe Tabelle oben).

### 2. Neues Userscript anlegen

Violentmonkey/Tampermonkey öffnen → **Neues Script erstellen** und oben folgenden Header einfügen:

**Für Filme:**
```javascript
// ==UserScript==
// @name         Jellyfin Version Selector - Filme
// @namespace    jellyfin-vsf-movie
// @version      1.0
// @match        http://DEINE-JELLYFIN-IP:PORT/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
```

**Für Serien:**
```javascript
// ==UserScript==
// @name         Jellyfin Version Selector - Serien
// @namespace    jellyfin-vsf-series
// @version      1.0
// @match        http://DEINE-JELLYFIN-IP:PORT/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
```

> ⚠️ `http://DEINE-JELLYFIN-IP:PORT/*` durch deine echte Jellyfin-URL ersetzen, z. B. `http://192.168.1.50:8096/*` oder `https://jellyfin.meinedomain.de/*`

### 3. Script-Inhalt einfügen

Unterhalb des Headers den **kompletten Inhalt** der jeweiligen Script-Datei einfügen:

- Für Filme → Inhalt aus `Version Selector Movie.js`
- Für Serien → Inhalt aus `Version Selector Serie.js`

### 4. Beide Scripts aktiv haben

Wiederhole Schritt 2–3 für das zweite Script. Beide können gleichzeitig aktiv sein – sie nutzen unterschiedliche Element-IDs und stören sich nicht gegenseitig.

### 5. Jellyfin neu laden

Seite neu laden → auf einen Film oder eine Episode mit mehreren Versionen navigieren → Button erscheint automatisch.

---

## 🗂️ Dateiübersicht

| Datei | Beschreibung |
|---|---|
| `Version Selector Movie.js` | Script für **Filme** (`Type: Movie`) |
| `Version Selector Serie.js` | Script für **Serien/Episoden** (`Type: Episode`) |

---

## 🔧 Technische Details

- Beide Scripts laufen als **IIFE** (sofort ausgeführte Funktion) ohne globale Variablen
- Nutzen die native **Jellyfin `ApiClient`-API** – kein externer Server nötig
- Button-Injektion via `setInterval` (alle 800 ms) – erkennt Seitennavigation automatisch
- Versionsumschaltung über natives Jellyfin `select.selectSource`-Element oder Hash-Navigation
- Position wird in **Ticks** (1/10.000.000 Sekunde) gespeichert und nach dem Laden wiederhergestellt

---

## ❓ Häufige Probleme

| Problem | Lösung |
|---|---|
| Button erscheint nicht | Prüfen ob `@match` URL korrekt ist; Seite neu laden |
| Nur eine Version angezeigt | Dateien korrekt benennen + Bibliothek neu scannen |
| Version wechselt nicht | `select.selectSource` im DOM prüfen; ggf. Jellyfin-Version veraltet |
| Popup öffnet sich nicht | Browser-Konsole auf Fehler prüfen (F12) |

---

## 📄 Lizenz

Dieses Projekt ist frei verwendbar für den privaten Gebrauch. Keine kommerzielle Nutzung ohne Rücksprache.
