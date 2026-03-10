New Fixed and upgraded Version
# 🎬 Jellyfin Version Selector

A browser script duo that injects a **"Select Version"** button directly into the detail page in [Jellyfin](https://jellyfin.org) — separately for movies and series/episodes.

With a single click, you can switch between multiple stored versions of the same file (e.g., 4K Remux, 1080p BluRay, WEB-DL, Ger Dub, Eng Sub) without navigating through menus.

---

## 📋 Requirements

### JavaScript Injector Required

These scripts do **not** run on their own. You need a browser extension or plugin that automatically executes custom JavaScript — for example the **JS Injector** plugin for Jellyfin.

---

## 📁 File Overview

| File | Description |
| --- | --- |
| `Final Fix Movie.js` | Script for Movies (`Type: Movie`) |
| `Final Fix Serie.js` | Script for Series/Episodes — **Manual Label** version |
| `Final Fix Series with auto label` | Script for Series/Episodes — **Auto Label** version (recommended) |

---

## 🏷️ Version Label — Two Variants for Series

The version selector displays a label for each available version in the popup.
There are **two different variants** for how this label is determined:

---

### Variant 1 — Manual Label (`Final Fix Serie.js`)

The label is determined by **fixed regex rules** that match known folder name patterns.

**How it works:**
The script checks if the file path contains a folder named `Ger Dub`, `Eng Dub`, `Ger Sub`, or `Eng Sub` (with various separators like spaces, dots, dashes, underscores).

```javascript
function verName(s, i) {
  const path = (s.Path || '').toLowerCase();
  if (/[/\\]ger[\s._-]?dub[/\\]/.test(path)) return 'Ger Dub';
  if (/[/\\]eng[\s._-]?dub[/\\]/.test(path)) return 'Eng Dub';
  if (/[/\\]ger[\s._-]?sub[/\\]/.test(path)) return 'Ger Sub (Hard)';
  if (/[/\\]eng[\s._-]?sub[/\\]/.test(path)) return 'Eng Sub (Hard)';
  const parts = path.split(/[/\\]/).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return 'Version ' + (i + 1);
}
```

**✅ Use this if:**
- You want full control over the displayed label names
- You want to customize what each folder name shows as

**⚠️ Important:**
- You must **manually add** new regex rules whenever you add a new language folder
- If your folder is named `Ko Dub` or `Ita Dub`, you need to add a matching rule yourself

**Example folder structure:**
```
/Anime/Serienname/Ger Dub/Staffel 1/Episode.mkv   → shows "Ger Dub"
/Anime/Serienname/Eng Dub/Staffel 1/Episode.mkv   → shows "Eng Dub"
/Anime/Serienname/Ger Sub/Staffel 1/Episode.mkv   → shows "Ger Sub (Hard)"
/Anime/Serienname/Eng Sub/Staffel 1/Episode.mkv   → shows "Eng Sub (Hard)"
```

---

### Variant 2 — Auto Label (`Final Fix Series with auto label`) ✅ Recommended

The label is determined **automatically** by reading the **parent folder name** of each file directly from the path — no manual rules needed.

**How it works:**
The script takes the folder that is directly above the episode file and uses its name as the label. Whatever you name the folder, that's what appears in the popup.

```javascript
function verName(s, i) {
  const parts = (s.Path || '').replace(/\\/g, '/').split('/').filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return 'Version ' + (i + 1);
}
```

**✅ Use this if:**
- You have many different language folders (Ko Dub, Ita Dub, etc.)
- You don't want to maintain the script when adding new folders
- You want the label to always match exactly what your folder is called

**Example folder structure:**
```
/Anime/Serienname/Ger Dub/Staffel 1/Episode.mkv   → shows "Ger Dub"
/Anime/Serienname/Ko Dub/Staffel 1/Episode.mkv    → shows "Ko Dub"
/Anime/Serienname/Ita Sub/Staffel 1/Episode.mkv   → shows "Ita Sub"
/Anime/Serienname/8K/Staffel 1/Episode.mkv        → shows "8K"
```

The label is always the exact folder name — no configuration needed.

<img width="720" height="410" alt="auto_label_preview" src="https://github.com/user-attachments/assets/b85c72da-9619-4207-858e-df75eb22ff85" />


---

## 📁 File Naming & Creating Versions in Jellyfin

For the Version Selector to work, Jellyfin must recognize the files as different versions of the same episode. This requires the episode files to have **matching names** (same series name + episode number).

### 📺 Series / Episodes

Episode versions must be in **separate language folders**, each inside matching season folders.

```
/Anime/Serienname/
    ├── Ger Dub/
    │   └── Staffel 1/
    │       └── Serienname S01E01.mkv
    ├── Eng Dub/
    │   └── Staffel 1/
    │       └── Serienname S01E01.mkv
    └── Ger Sub/
        └── Staffel 1/
            └── Serienname S01E01.mkv
```

### 🎬 Movies

All versions must be in **the same folder** and share the same movie title. The part after the last ` - ` is used as the version name.

```
/movies/The Dark Knight (2008)/
    ├── The Dark Knight (2008) - Remux 4K HDR.mkv
    ├── The Dark Knight (2008) - BluRay 1080p.mkv
    └── The Dark Knight (2008) - WEB-DL 1080p.mkv
```

---

### Merging Versions in Jellyfin

If Jellyfin does not automatically merge files:

1. Open Jellyfin Admin Dashboard → **Scan Library**
2. Or open the movie/series → long-press the item → **Merge Versions**

---

## Version Popup (Series)

```
┌─────────────────────────────────┐
│ 📺 VERSIONS    3 available      │
├─────────────────────────────────┤
│ ✅ Ger Dub                      │
│    1080p · 4.8 GB               │
├─────────────────────────────────┤
│    Eng Dub                      │
│    1080p · 4.8 GB               │
├─────────────────────────────────┤
│    Ger Sub                      │
│    1080p · 4.1 GB               │
└─────────────────────────────────┘
```

---

## ⚡ Version Switching

- Click a version → instant switch
- **Playback position is preserved** — resumes at the same timestamp
- If only one version exists → toast message: `ℹ Nur eine Version`

---

## 🚀 Installation

### 1. Install a JavaScript Injector

Install the **JS Injector** plugin in your Jellyfin dashboard.

### 2. Add Scripts

Click **Add Script** and add the scripts **separately**:

- `Final Fix Movie.js` → for movies
- `Final Fix Serie.js` **or** `Final Fix Series with auto label` → for series (pick one)

### 3. Reload Jellyfin

Refresh the page → open an episode with multiple versions → the button appears automatically.

---

## 📌 Metadata Displayed

For each version the following is shown (if available):

- **Resolution** – e.g. `1080p`, `720p`, `2160p`
- **File Size** – e.g. `4.8 GB`

---

## ❓ Common Issues

| Problem | Solution |
| --- | --- |
| Button does not appear | Go to the detail page and reload |
| Only one version shown | Verify multiple versions are available and reload |
| Version does not switch | Go to the detail page and reload |
| Doesn't work on web app | Set Cache size to **Tiny** in Jellyfin Settings |
| Labels still show `1` | Make sure you are using the correct script variant and that the folder structure matches |

---

## 📄 License

Free for private use.  
Commercial use requires prior permission.

Please help improve the scripts by reporting bugs!New Fix Version
# 🎬 Jellyfin Version Selector

A browser script duo that injects a **"Select Version"** button directly into the detail page in [Jellyfin](https://jellyfin.org) — separately for movies and series/episodes.

With a single click, you can switch between multiple stored versions of the same file (e.g., 4K Remux, 1080p BluRay, WEB-DL, Ger Dub, Eng Sub) without navigating through menus.

---

## 📋 Requirements

### JavaScript Injector Required

These scripts do **not** run on their own. You need a browser extension or plugin that automatically executes custom JavaScript — for example the **JS Injector** plugin for Jellyfin.

---

## 📁 File Overview

| File | Description |
| --- | --- |
| `Final Fix Movie.js` | Script for Movies (`Type: Movie`) |
| `Final Fix Serie.js` | Script for Series/Episodes — **Manual Label** version |
| `Final Fix Series with auto label` | Script for Series/Episodes — **Auto Label** version (recommended) |

---

## 🏷️ Version Label — Two Variants for Series

The version selector displays a label for each available version in the popup.
There are **two different variants** for how this label is determined:

---

### Variant 1 — Manual Label (`Final Fix Serie.js`)

The label is determined by **fixed regex rules** that match known folder name patterns.

**How it works:**
The script checks if the file path contains a folder named `Ger Dub`, `Eng Dub`, `Ger Sub`, or `Eng Sub` (with various separators like spaces, dots, dashes, underscores).
```javascript
function verName(s, i) {
  const path = (s.Path || '').toLowerCase();
  if (/[/\\]ger[\s._-]?dub[/\\]/.test(path)) return 'Ger Dub';
  if (/[/\\]eng[\s._-]?dub[/\\]/.test(path)) return 'Eng Dub';
  if (/[/\\]ger[\s._-]?sub[/\\]/.test(path)) return 'Ger Sub (Hard)';
  if (/[/\\]eng[\s._-]?sub[/\\]/.test(path)) return 'Eng Sub (Hard)';
  const parts = path.split(/[/\\]/).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return 'Version ' + (i + 1);
}
```

**✅ Use this if:**
- You want full control over the displayed label names
- You want to customize what each folder name shows as

**⚠️ Important:**
- You must **manually add** new regex rules whenever you add a new language folder
- If your folder is named `Ko Dub` or `Ita Dub`, you need to add a matching rule yourself

**Example folder structure:**
```
/Anime/Serienname/Ger Dub/Staffel 1/Episode.mkv   → shows "Ger Dub"
/Anime/Serienname/Eng Dub/Staffel 1/Episode.mkv   → shows "Eng Dub"
/Anime/Serienname/Ger Sub/Staffel 1/Episode.mkv   → shows "Ger Sub (Hard)"
/Anime/Serienname/Eng Sub/Staffel 1/Episode.mkv   → shows "Eng Sub (Hard)"
```

---

### Variant 2 — Auto Label (`Final Fix Series with auto label`) ✅ Recommended

The label is determined **automatically** by reading the **parent folder name** of each file directly from the path — no manual rules needed.

**How it works:**
The script takes the folder that is directly above the episode file and uses its name as the label. Whatever you name the folder, that's what appears in the popup.
```javascript
function verName(s, i) {
  const parts = (s.Path || '').replace(/\\/g, '/').split('/').filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return 'Version ' + (i + 1);
}
```

**✅ Use this if:**
- You have many different language folders (Ko Dub, Ita Dub, etc.)
- You don't want to maintain the script when adding new folders
- You want the label to always match exactly what your folder is called

**Example folder structure:**
```
/Anime/Serienname/Ger Dub/Staffel 1/Episode.mkv   → shows "Ger Dub"
/Anime/Serienname/Ko Dub/Staffel 1/Episode.mkv    → shows "Ko Dub"
/Anime/Serienname/Ita Sub/Staffel 1/Episode.mkv   → shows "Ita Sub"
/Anime/Serienname/8K/Staffel 1/Episode.mkv        → shows "8K"
```

The label is always the exact folder name — no configuration needed.

---

## 📁 File Naming & Creating Versions in Jellyfin

For the Version Selector to work, Jellyfin must recognize the files as different versions of the same episode. This requires the episode files to have **matching names** (same series name + episode number).

### 📺 Series / Episodes

Episode versions must be in **separate language folders**, each inside matching season folders.
```
/Anime/Serienname/
    ├── Ger Dub/
    │   └── Staffel 1/
    │       └── Serienname S01E01.mkv
    ├── Eng Dub/
    │   └── Staffel 1/
    │       └── Serienname S01E01.mkv
    └── Ger Sub/
        └── Staffel 1/
            └── Serienname S01E01.mkv
```

### 🎬 Movies

All versions must be in **the same folder** and share the same movie title. The part after the last ` - ` is used as the version name.
```
/movies/The Dark Knight (2008)/
    ├── The Dark Knight (2008) - Remux 4K HDR.mkv
    ├── The Dark Knight (2008) - BluRay 1080p.mkv
    └── The Dark Knight (2008) - WEB-DL 1080p.mkv
```

---

### Merging Versions in Jellyfin

If Jellyfin does not automatically merge files:

1. Open Jellyfin Admin Dashboard → **Scan Library**
2. Or open the movie/series → long-press the item → **Merge Versions**

---

## Version Popup (Series)
```
┌─────────────────────────────────┐
│ 📺 VERSIONS    3 available      │
├─────────────────────────────────┤
│ ✅ Ger Dub                      │
│    1080p · 4.8 GB               │
├─────────────────────────────────┤
│    Eng Dub                      │
│    1080p · 4.8 GB               │
├─────────────────────────────────┤
│    Ger Sub                      │
│    1080p · 4.1 GB               │
└─────────────────────────────────┘
```

---

## ⚡ Version Switching

- Click a version → instant switch
- **Playback position is preserved** — resumes at the same timestamp
- If only one version exists → toast message: `ℹ Nur eine Version`

---

## 🚀 Installation

### 1. Install a JavaScript Injector

Install the **JS Injector** plugin in your Jellyfin dashboard.

### 2. Add Scripts

Click **Add Script** and add the scripts **separately**:

- `Final Fix Movie.js` → for movies
- `Final Fix Serie.js` **or** `Final Fix Series with auto label` **or** `Final Fix Series Manuell label
 → for series (pick one)

### 3. Reload Jellyfin

Refresh the page → open an episode with multiple versions → the button appears automatically.

---

## 📌 Metadata Displayed

For each version the following is shown (if available):

- **Resolution** – e.g. `1080p`, `720p`, `2160p`
- **File Size** – e.g. `4.8 GB`

---

## ❓ Common Issues

| Problem | Solution |
| --- | --- |
| Button does not appear | Go to the detail page and reload |
| Only one version shown | Verify multiple versions are available and reload |
| Version does not switch | Go to the detail page and reload |
| Doesn't work on web app | Set Cache size to **Tiny** in Jellyfin Settings |
| Labels still show `1` | Make sure you are using the correct script variant and that the folder structure matches |

---

## 📄 License

Free for private use.  
Commercial use requires prior permission.

Please help improve the scripts by reporting bugs!
