# YouTube Music Organizer Extension Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a Chrome Extension that automatically organizes a user's YouTube Music playlists by genre, without requiring any third-party APIs.

**Architecture:** A Manifest V3 Chrome Extension using a Popup UI for configuration and progress, a Background Service Worker to orchestrate state, and Content Scripts injected into `music.youtube.com` to act as the bridge to YouTube Music's internal data APIs and DOM.

**Tech Stack:** HTML, CSS, Vanilla JavaScript (ES6+), Chrome Extension API (Manifest V3), Jest (for unit testing logic).

---

### Task 1: Project Initialization & Manifest
**Files:**
- Create: `package.json`
- Create: `manifest.json`

**Step 1: Setup project and testing environment**
Run: `npm init -y && npm install --save-dev jest`

**Step 2: Create Manifest V3**
```json
{
  "manifest_version": 3,
  "name": "YouTube Music Auto Organizer",
  "version": "1.0",
  "description": "Automatically sort your YouTube Music playlists into genre-based folders.",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["*://music.youtube.com/*"],
  "action": {
    "default_popup": "src/popup/popup.html"
  },
  "background": {
    "service_worker": "src/background/background.js"
  },
  "content_scripts": [
    {
      "matches": ["*://music.youtube.com/*"],
      "js": ["src/content/content.js"]
    }
  ],
  "icons": {
    "128": "assets/icon128.png"
  }
}
```

**Step 3: Commit**
```bash
git add package.json manifest.json
git commit -m "chore: setup project and manifest v3"
```

### Task 2: Core Data Extraction Logic (Unit Tested)
**Files:**
- Create: `src/utils/parser.js`
- Create: `tests/utils/parser.test.js`

**Step 1: Write failing test for parsing genre data**
```javascript
const { parseGenreFromDOM } = require('../../src/utils/parser');

test('parseGenreFromDOM extracts genre text', () => {
  // Mocking the YTM DOM structure for a song info panel
  const mockDOM = `<div><yt-formatted-string class="genre-text">Pop/Rock</yt-formatted-string></div>`;
  const result = parseGenreFromDOM(mockDOM);
  expect(result).toBe('Pop/Rock');
});
```

**Step 2: Run test to verify it fails**
Run: `npx jest tests/utils/parser.test.js`
Expected: FAIL "parseGenreFromDOM is not defined"

**Step 3: Write minimal implementation**
```javascript
function parseGenreFromDOM(htmlString) {
  // Simplified for unit test; in reality, we'll parse JSON state or query DOM nodes
  const match = htmlString.match(/class="genre-text">([^<]+)<\//);
  return match ? match[1] : null;
}
module.exports = { parseGenreFromDOM };
```

**Step 4: Run test to verify it passes**
Run: `npx jest tests/utils/parser.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/utils/parser.js tests/utils/parser.test.js
git commit -m "feat: add parser utility for genre extraction"
```

### Task 3: Popup UI Foundation
**Files:**
- Create: `src/popup/popup.html`
- Create: `src/popup/popup.css`
- Create: `src/popup/popup.js`

**Step 1: Create popup.html**
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: 320px; padding: 16px; margin: 0; background: #0f0f0f; color: white;}
    button { background: #ff0000; color: white; border: none; padding: 10px 16px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold;}
    select { width: 100%; padding: 8px; margin-bottom: 16px; background: #212121; color: white; border: 1px solid #3d3d3d; border-radius: 4px;}
  </style>
</head>
<body>
  <h2>YTM Organizer</h2>
  <label for="playlist-select">Source Playlist:</label>
  <select id="playlist-select">
    <option value="LM">Your Likes</option>
  </select>
  <button id="start-btn">Organize by Genre</button>
  <div id="status" style="margin-top: 12px; font-size: 12px; color: #aaa;"></div>
  <script src="popup.js"></script>
</body>
</html>
```

**Step 2: Create popup.js to send message**
```javascript
document.getElementById('start-btn').addEventListener('click', () => {
  const playlistId = document.getElementById('playlist-select').value;
  document.getElementById('status').innerText = 'Initializing...';
  chrome.runtime.sendMessage({ action: "START_ORGANIZING", playlistId });
});
```

**Step 3: Commit**
```bash
git add src/popup/
git commit -m "feat: build basic popup UI"
```

### Task 4: Background Service Worker & Content Script Bridge
**Files:**
- Create: `src/background/background.js`
- Create: `src/content/content.js`

**Step 1: Create Background Listener**
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_ORGANIZING") {
    // Inject or send message to active tab to start fetching
    chrome.tabs.query({url: "*://music.youtube.com/*"}, (tabs) => {
      if(tabs.length === 0) {
        console.error("No YouTube Music tab found.");
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: "FETCH_PLAYLIST", playlistId: request.playlistId });
    });
  }
});
```

**Step 2: Create Content Script Receiver**
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_PLAYLIST") {
    console.log("Fetching playlist data for ID:", request.playlistId);
    // In actual implementation, this will query the ytInitialData or fetch internal API
    sendResponse({ status: "started" });
  }
});
```

**Step 3: Commit**
```bash
git add src/background/background.js src/content/content.js
git commit -m "feat: setup message bridge between popup, background, and content script"
```
