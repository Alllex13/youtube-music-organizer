# API Orchestration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement real YouTube Music API interactions, handling authentication extraction, playlist fetching, batched genre extraction, and playlist creation.

**Architecture:** The content script parses `ytcfg` from the DOM and sends it to the Service Worker. The Service Worker uses `fetch` to orchestrate requests to the internal `youtubei/v1` endpoints to move tracks, keeping the user updated via `POST_PROGRESS` messages.

**Tech Stack:** Vanilla JavaScript (ES6+), Chrome Extension API (Manifest V3), Jest.

---

### Task 1: Configuration Extraction Parser (Unit Tested)

**Files:**
- Modify: `src/utils/parser.js`
- Modify: `tests/utils/parser.test.js`

**Step 1: Write the failing test**

```javascript
test('extractYtcfg parses configuration object from HTML', () => {
  const { extractYtcfg } = require('../../src/utils/parser');
  const mockHTML = `<html><head><script>ytcfg.set({"INNERTUBE_API_KEY":"testKey","CLIENT_VERSION":"1.0","SAPISIDHASH":"testHash"});</script></head><body></body></html>`;
  const config = extractYtcfg(mockHTML);
  expect(config.INNERTUBE_API_KEY).toBe('testKey');
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/utils/parser.test.js`
Expected: FAIL "extractYtcfg is not defined"

**Step 3: Write minimal implementation**

```javascript
// Add to src/utils/parser.js
function extractYtcfg(htmlString) {
  const match = htmlString.match(/ytcfg\.set\(({.*?})\);/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      return null;
    }
  }
  return null;
}
// Update module.exports
module.exports = { parseGenreFromDOM, extractYtcfg };
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/utils/parser.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/parser.js tests/utils/parser.test.js
git commit -m "feat: add ytcfg extraction parser"
```

### Task 2: Content Script Bridge & Extraction

**Files:**
- Modify: `src/content/content.js`

**Step 1: Write the implementation**

```javascript
// src/content/content.js
// Assuming we inline or import the parser (extensions require bundling or ES modules, but we'll keep it simple for now)
function extractYtcfg(htmlString) {
  const match = htmlString.match(/ytcfg\.set\(({.*?})\);/);
  return match && match[1] ? JSON.parse(match[1]) : null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_PLAYLIST") {
    console.log("Fetching playlist data for ID:", request.playlistId);
    const config = extractYtcfg(document.documentElement.innerHTML);
    if (config) {
       chrome.runtime.sendMessage({ action: "CONFIG_EXTRACTED", config, playlistId: request.playlistId });
       sendResponse({ status: "started" });
    } else {
       sendResponse({ status: "error", message: "Could not find ytcfg" });
    }
  }
});
```

**Step 2: No isolated unit test required for chrome runtime listeners**

**Step 3: Commit**

```bash
git add src/content/content.js
git commit -m "feat: implement content script config extraction"
```

### Task 3: API Client Foundation

**Files:**
- Create: `src/background/api.js`

**Step 1: Write minimal implementation**

```javascript
// src/background/api.js
class YTMClient {
  constructor(config) {
    this.key = config.INNERTUBE_API_KEY;
    this.version = config.CLIENT_VERSION;
    // For a real implementation, SAPISID requires cookie reading, but we simulate the structure
    this.headers = {
      'Content-Type': 'application/json',
      'X-YouTube-Client-Name': '69',
      'X-YouTube-Client-Version': this.version
    };
  }

  async fetchPlaylist(playlistId) {
    // Stub for browse endpoint
    console.log(\`Fetching \${playlistId} with key \${this.key}\`);
    return { tracks: [] }; 
  }
}

// Ensure it can be exported or used in Service Worker
if (typeof module !== 'undefined') module.exports = { YTMClient };
```

**Step 2: Commit**

```bash
git add src/background/api.js
git commit -m "feat: create base YTM API client"
```

### Task 4: Connect Background Orchestration

**Files:**
- Modify: `src/background/background.js`

**Step 1: Write minimal implementation**

```javascript
// src/background/background.js
importScripts('api.js');

let autoSyncEnabled = false;
let ytmClient = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_ORGANIZING") {
    chrome.tabs.query({url: "*://music.youtube.com/*"}, (tabs) => {
      if(tabs.length === 0) return console.error("No YouTube Music tab found.");
      chrome.tabs.sendMessage(tabs[0].id, { action: "FETCH_PLAYLIST", playlistId: request.playlistId });
    });
  } else if (request.action === "CONFIG_EXTRACTED") {
    ytmClient = new YTMClient(request.config);
    ytmClient.fetchPlaylist(request.playlistId).then(data => {
       console.log("Playlist fetched successfully in background");
       // Future step: update progress and process genres
    });
  } else if (request.action === "UPDATE_SYNC_SETTINGS") {
    autoSyncEnabled = request.autoSync;
    sendResponse({ success: true });
  }
});

chrome.webRequest.onCompleted.addListener((details) => {
    if (autoSyncEnabled && details.url.includes('like/like')) {
      console.log('New song liked! Auto-sync triggered.');
    }
  },
  { urls: ["*://music.youtube.com/youtubei/v1/like/like*"] }
);
```

**Step 2: Commit**

```bash
git add src/background/background.js
git commit -m "feat: connect background service to API client"
```
