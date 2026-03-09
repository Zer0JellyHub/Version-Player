99% Bug Free
🎬 Jellyfin Version Selector

A browser script duo that injects a **“Select Version”** button directly into the detail page in [Jellyfin](https://jellyfin.org) — separately for movies and series/episodes.And a bug fixed Version for both.

With a single click, you can switch between multiple stored versions of the same file (e.g., 4K Remux, 1080p BluRay, WEB-DL) without navigating through menus.

---

## 📋 Requirements

### JavaScript Injector Required

These scripts do **not** run on their own. You need a browser extension that automatically executes custom JavaScript.


---

## 📁 File Naming & Creating Versions in Jellyfin

For the Version Selector to work and display meaningful names, files must be **properly named and stored in the correct folder**.  
Jellyfin automatically detects multiple files in the same folder as different versions of the same title.

---

### 🎬 Movies

All versions of a movie must be placed in **the same folder** and must share the **exact same movie title** in the filename. Or younamed it like u want it works fine too.

The part after the last ` - ` (space-dash-space) will be displayed as the version name in the selector.

```
/movies/The Dark Knight (2008)/
    ├── The Dark Knight (2008) - Remux 4K HDR.mkv
    ├── The Dark Knight (2008) - BluRay 1080p.mkv
    └── The Dark Knight (2008) - WEB-DL 1080p.mkv
```

Displayed version names:

- Remux 4K HDR  
- BluRay 1080p  
- WEB-DL 1080p  

💡 Tip: Use clear naming like `Remux 4K HDR`, `BluRay 1080p x265`, `WEB-DL SDR`, `Extended Cut`, etc.

---

### 📺 Series / Episodes

Same logic as movies — episode versions must be in **the same season folder**. Or younamed it like u want it works fine too.

Important: The episode number (e.g., `S01E05`) and title must match exactly.

```
/series/Breaking Bad/Season 01/
    ├── Breaking Bad S01E05 - BluRay 1080p.mkv
    └── Breaking Bad S01E05 - WEB-DL 720p.mkv
```

Displayed version names:

- BluRay 1080p  
- WEB-DL 720p  

---

### Merging Versions in the Jellyfin Library

If Jellyfin does not automatically merge the files:

1. Open Jellyfin Web UI → Admin Dashboard → **Scan Library**
2. Or open the movie/series → `···` menu → **Merge Versions**


---

### Version Popup (Movies)

```
┌─────────────────────────────────┐
│ 🎬 VERSIONS    3 available      │
├─────────────────────────────────┤
│ ✅ Remux 4K HDR                 │
│    2160p · HEVC · 58.3 GB       │
├─────────────────────────────────┤
│    BluRay 1080p                 │
│    1080p · H264 · 15.7 GB       │
├─────────────────────────────────┤
│    WEB-DL 1080p                 │
│    1080p · H265 · 8.2 GB        │
├─────────────────────────────────┤
│   ▶ Starts at same position     │
└─────────────────────────────────┘
```

### Version Popup (Series / Episodes)

```
┌─────────────────────────────────┐
│ 📺 VERSIONS    2 available      │
├─────────────────────────────────┤
│ ✅ BluRay 1080p                 │
│    1080p · H265 · 4.8 GB        │
├─────────────────────────────────┤
│    WEB-DL 720p                  │
│    720p · H264 · 1.2 GB         │
├─────────────────────────────────┤
│   ▶ Starts at same position     │
└─────────────────────────────────┘
```

---

## 📌 Metadata Displayed

For each version, the following information is shown (if provided by Jellyfin):

- **Resolution** – e.g. `2160p`, `1080p`, `720p`
- **Codec** – e.g. `HEVC`, `H264`, `AV1`
- **File Size** – e.g. `58.3 GB`

---

## ⚡ Version Switching


- Click a version → instant switch  
- **Playback position is preserved** — resumes at the same timestamp (not yet) 
- If only one version exists → toast message: `ℹ Only one version`  
- While switching during playback → short message: `⏳ Switching...`

---
## 🖥️ How It Looks in the Player

### Detail Page Button

The button `▤` (video library icon) is automatically inserted **next to the favorite heart button** in the detail page action bar:

```
[ ▶ Play ]  [ ⇄ ]  [ ♡ ]  [ ▤ ]
```

The button appears **only** if more than one version exists.  
For single-version titles, the interface remains unchanged.

<img width="1438" height="759" alt="preview_button_injection" src="https://github.com/user-attachments/assets/86e833fc-19b2-44d2-b8b1-1a5342399120" />
<img width="2796" height="1290" alt="IMG_4963" src="https://github.com/user-attachments/assets/89027256-8e20-4838-bf97-a87a96610187" />


How it could look like at movies and Series (depends on your naming)

<img width="382" height="502" alt="Bildschirmfoto 2026-02-28 um 00 57 57" src="https://github.com/user-attachments/assets/ba892437-1383-40d7-9757-d7a08493604a" />
<img width="397" height="509" alt="Bildschirmfoto 2026-02-28 um 00 57 17" src="https://github.com/user-attachments/assets/72fa67ac-1e4a-4f38-b3e7-74b19457d15e" />

---

## 🚀 Installation (Step-by-Step)

### 1 Install a JavaScript Injector

---

### 2 Insert Script Content

Below the header, paste the full content of 1 and 2 or 3 alone.

- 1 `Version Selector Movie.js`
- 2 `Version Selector Series.js`
- 3 `Both better Fixed.js`

---

### 3 Activate Both Scripts or the third

Repeat for the second script.  
Both can run simultaneously — they use different element IDs.

---

### 4 Reload Jellyfin

Refresh the page → open a movie or episode with multiple versions → the button appears automatically.

---

## 🗂️ File Overview

| File | Description |
|---|---|
| `Version Selector Movie.js` | Script for Movies (`Type: Movie`) |
| `Version Selector Series.js` | Script for Series/Episodes (`Type: Episode`) |

---

## 🔧 Technical Details

- Runs as **IIFE** (Immediately Invoked Function Expression)
- No global variables
- Uses native Jellyfin `ApiClient` API
- Button injection via `setInterval` (800 ms)
- Switching via native `select.selectSource` element or hash navigation
- Playback position stored in **ticks** (1/10,000,000 second) and restored after load

---

## ❓ Common Issues

| Problem | Solution |
|---|---|
| Button does not appear | Check `@match` URL and reload | Fixed
| Only one version shown | Verify file naming and rescan library or URL reload |
| Version does not switch | Check `select.selectSource` in DOM or URL reload | Fixed
| Popup does not open | Check browser console (F12) | Fixed
| Does not show that it has switch the version but it switched | Fixed
| Doesnt work on the web app| Select (in Settings) Cache size tiny|
<img width="1440" height="900" alt="Bildschirmfoto 2026-03-02 um 05 00 01" src="https://github.com/user-attachments/assets/2196a529-1cc7-4bdd-82cf-348e5c132fbe" />


---

## 📄 License

Free for private use.  
Commercial use requires prior permission.
Please help me to fix the bugs
