# Modern Premium UI Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a dark-themed, glassmorphic Single-Page App (SPA) popup interface for the YouTube Music Auto Organizer Chrome Extension with smooth slide transitions and interactive cards.

**Architecture:** The popup HTML will define 5 separate card sections. CSS transitions will govern active/inactive transformations and opacity. A state machine in `popup.js` will handle switching between cards and rendering dynamic content (such as duplicate groups or uncategorized tracks) from background data.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+), Chrome Extension APIs (Manifest V3).

---

### Task 1: Styling Foundation & Glassmorphic CSS

**Files:**
- Modify: [popup.css](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.css)

**Step 1: Write the implementation**
Open [popup.css](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.css) and add the complete styling framework:
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap');

body {
  font-family: 'Outfit', sans-serif;
  width: 320px;
  margin: 0;
  background: #080808;
  color: #ffffff;
  overflow: hidden;
}

.popup-viewport {
  position: relative;
  width: 320px;
  min-height: 400px;
  overflow: hidden;
  background: #080808;
}

/* Glassmorphic Cards */
.card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: linear-gradient(135deg, rgba(28, 28, 28, 0.7) 0%, rgba(18, 18, 18, 0.8) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
  opacity: 0;
  pointer-events: none;
}

.card.active {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.card.slide-out-left {
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
}

.card.slide-in-right {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

/* YTM Red Buttons */
button {
  background: linear-gradient(135deg, #FF0000 0%, #B30000 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  width: 100%;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2);
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 0, 0, 0.4);
}

button:active {
  transform: translateY(0);
}

/* Form Inputs */
select, input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(33, 33, 33, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-sizing: border-box;
  font-family: 'Outfit', sans-serif;
}

select:focus, input[type="text"]:focus {
  outline: none;
  border-color: #FF0000;
}

/* Custom Scrollbar */
.scroll-container {
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding-right: 4px;
}

.scroll-container::-webkit-scrollbar {
  width: 4px;
}

.scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.scroll-container::-webkit-scrollbar-thumb {
  background: #FF0000;
  border-radius: 2px;
}
```

**Step 2: Commit**
```bash
git add src/popup/popup.css
git commit -m "feat: add premium glassmorphic styles and custom scrollbar"
```

---

### Task 2: Create Multi-Card HTML Structure

**Files:**
- Modify: [popup.html](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.html)

**Step 1: Write the implementation**
Replace [popup.html](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.html) to support the card viewport layout structure:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>YTM Organizer</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-viewport">
    
    <!-- CARD 1: SETUP -->
    <section id="card-setup" class="card active">
      <h2 style="margin-top: 0; font-weight: 700; background: linear-gradient(90deg, #FFF, #FF4D4D); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">YTM Organizer</h2>
      
      <label for="playlist-select" style="font-size: 14px; color: #A0A0A0; display: block; margin-bottom: 6px;">Source Playlist:</label>
      <select id="playlist-select">
        <option value="LM">Your Likes</option>
      </select>
      
      <div style="margin-bottom: 20px; display: flex; align-items: center;">
        <input type="checkbox" id="auto-sync" style="margin-right: 8px; accent-color: #FF0000;">
        <label for="auto-sync" style="font-size: 14px; color: #E0E0E0; cursor: pointer;">Keep Organized (Auto-Sync)</label>
      </div>
      
      <button id="start-btn">Organize by Genre</button>
    </section>

    <!-- CARD 2: DUPLICATES -->
    <section id="card-duplicates" class="card">
      <h3 style="margin-top: 0; font-weight: 600; color: #FF4D4D;">Duplicates Detected</h3>
      <p style="font-size: 12px; color: #A0A0A0; margin-bottom: 10px;">Select versions of duplicates to remove:</p>
      
      <div id="duplicates-list" class="scroll-container">
        <!-- Rendered dynamically -->
      </div>
      
      <button id="delete-dup-btn">Delete & Continue</button>
    </section>

    <!-- CARD 3: SYNCING -->
    <section id="card-syncing" class="card">
      <div style="text-align: center; padding: 20px 0;">
        <div class="pulse-ring" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid #FF0000; display: inline-block; animation: pulse 1.5s infinite ease-in-out;"></div>
        <h3 id="sync-status" style="margin-top: 16px; font-weight: 500;">Initializing...</h3>
      </div>
      <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; overflow: hidden;">
        <div id="progress-bar" style="background: linear-gradient(90deg, #FF0000, #FF4D4D); width: 0%; height: 100%; transition: width 0.3s ease;"></div>
      </div>
    </section>

    <!-- CARD 4: UNCATEGORIZED -->
    <section id="card-uncategorized" class="card">
      <h3 style="margin-top: 0; font-weight: 600; color: #FF4D4D;">Uncategorized Tracks</h3>
      <p style="font-size: 12px; color: #A0A0A0; margin-bottom: 10px;">Assign genres manually:</p>
      
      <div id="uncategorized-list" class="scroll-container">
        <!-- Rendered dynamically -->
      </div>
      
      <button id="finish-btn">Finish Organization</button>
    </section>

    <!-- CARD 5: REPORT -->
    <section id="card-report" class="card">
      <h2 style="margin-top: 0; font-weight: 700; color: #00FF66;">Success!</h2>
      <p style="font-size: 14px; color: #E0E0E0; margin-bottom: 20px;" id="report-summary">Organization complete.</p>
      
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #A0A0A0;">
        <div>Tracks Organized: <span id="stat-organized" style="color: white; font-weight: 600;">0</span></div>
        <div>Playlists Created: <span id="stat-playlists" style="color: white; font-weight: 600;">0</span></div>
        <div>Duplicates Removed: <span id="stat-duplicates" style="color: white; font-weight: 600;">0</span></div>
      </div>
      
      <button id="home-btn">Done</button>
    </section>

  </div>
  
  <style>
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.5; box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); }
      70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
      100% { transform: scale(0.9); opacity: 0.5; box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
    }
  </style>
  <script src="popup.js"></script>
</body>
</html>
```

**Step 2: Commit**
```bash
git add src/popup/popup.html
git commit -m "feat: design 5-card layout markup in popup.html"
```

---

### Task 3: State Navigation and Dynamics in popup.js

**Files:**
- Modify: [popup.js](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.js)

**Step 1: Write the implementation**
Rewrite [popup.js](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.js) to manage the card active classes and register click listeners:
```javascript
const cards = {
  setup: document.getElementById('card-setup'),
  duplicates: document.getElementById('card-duplicates'),
  syncing: document.getElementById('card-syncing'),
  uncategorized: document.getElementById('card-uncategorized'),
  report: document.getElementById('card-report')
};

let activeCardKey = 'setup';

function showCard(targetKey) {
  Object.keys(cards).forEach(key => {
    const card = cards[key];
    if (key === targetKey) {
      card.className = 'card active';
    } else if (key === activeCardKey) {
      card.className = 'card slide-out-left';
    } else {
      card.className = 'card slide-in-right';
    }
  });
  activeCardKey = targetKey;
}

// Bind Home/Reset Actions
document.getElementById('home-btn').addEventListener('click', () => {
  showCard('setup');
});

// Bind Start Action
document.getElementById('start-btn').addEventListener('click', () => {
  const playlistId = document.getElementById('playlist-select').value;
  const autoSync = document.getElementById('auto-sync').checked;
  showCard('syncing');
  document.getElementById('sync-status').innerText = 'Initializing connection...';
  document.getElementById('progress-bar').style.width = '10%';
  
  // Request background to start sorting
  chrome.runtime.sendMessage({ action: "START_ORGANIZING", playlistId, autoSync });
});
```

**Step 2: Commit**
```bash
git add src/popup/popup.js
git commit -m "feat: implement SPA card navigation state controller in popup.js"
```

---

### Task 4: Duplicate & Uncategorized dynamic rendering

**Files:**
- Modify: [popup.js](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.js)

**Step 1: Write the implementation**
Append render functions and form controllers for dynamic list components:
```javascript
// Render duplicate track selection list
function renderDuplicates(duplicateGroups) {
  const container = document.getElementById('duplicates-list');
  container.innerHTML = '';
  
  duplicateGroups.forEach((group, index) => {
    const groupDiv = document.createElement('div');
    groupDiv.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    groupDiv.style.padding = '8px 0';
    
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.fontSize = '13px';
    title.innerText = group[0].title;
    groupDiv.appendChild(title);
    
    group.forEach(track => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.fontSize = '12px';
      label.style.color = '#A0A0A0';
      label.style.margin = '4px 0';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = `dup-group-${index}`;
      checkbox.value = track.id;
      checkbox.style.marginRight = '8px';
      // Auto-check first option to keep, others unchecked for deletion
      checkbox.checked = false; 
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(`${track.artist} (${track.id})`));
      groupDiv.appendChild(label);
    });
    container.appendChild(groupDiv);
  });
  
  showCard('duplicates');
}

// Render Uncategorized songs checklist
function renderUncategorized(tracks) {
  const container = document.getElementById('uncategorized-list');
  container.innerHTML = '';
  
  tracks.forEach(track => {
    const trackDiv = document.createElement('div');
    trackDiv.style.marginBottom = '10px';
    
    const label = document.createElement('div');
    label.style.fontSize = '12px';
    label.style.fontWeight = 'bold';
    label.innerText = `${track.title} - ${track.artist}`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g. Rock, Jazz, Pop';
    input.className = 'uncat-input';
    input.dataset.trackId = track.videoId;
    input.style.marginTop = '4px';
    
    trackDiv.appendChild(label);
    trackDiv.appendChild(input);
    container.appendChild(trackDiv);
  });
  
  showCard('uncategorized');
}
```

**Step 2: Commit**
```bash
git add src/popup/popup.js
git commit -m "feat: add dynamic rendering methods for duplicates and uncategorized list cards"
```

---

### Task 5: Handle Message Streams and Action Hooks

**Files:**
- Modify: [popup.js](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.js)
- Modify: [background.js](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/background/background.js)

**Step 1: Wire up message listeners in popup.js**
Append message listening hooks at the bottom of [popup.js](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/popup/popup.js):
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "UPDATE_PROGRESS") {
    showCard('syncing');
    document.getElementById('sync-status').innerText = message.status;
    document.getElementById('progress-bar').style.width = `${message.percent || 10}%`;
  } else if (message.action === "SHOW_DUPLICATES") {
    renderDuplicates(message.duplicates);
  } else if (message.action === "SHOW_UNCATEGORIZED") {
    renderUncategorized(message.tracks);
  } else if (message.action === "ORGANIZATION_COMPLETE") {
    showCard('report');
    document.getElementById('stat-organized').innerText = message.stats.organized;
    document.getElementById('stat-playlists').innerText = message.stats.playlists;
    document.getElementById('stat-duplicates').innerText = message.stats.duplicates;
  }
});

// Event listener for Duplicate Delete button
document.getElementById('delete-dup-btn').addEventListener('click', () => {
  const checkedCheckboxes = document.querySelectorAll('[name^="dup-group-"]:checked');
  const idsToDelete = Array.from(checkedCheckboxes).map(cb => cb.value);
  showCard('syncing');
  document.getElementById('sync-status').innerText = 'Removing duplicates...';
  chrome.runtime.sendMessage({ action: "DUPLICATES_RESOLVED", idsToDelete });
});

// Event listener for Finish Uncategorized button
document.getElementById('finish-btn').addEventListener('click', () => {
  const inputs = document.querySelectorAll('.uncat-input');
  const resolutions = Array.from(inputs).map(inp => ({
    videoId: inp.dataset.trackId,
    genre: inp.value.trim() || "Uncategorized"
  }));
  showCard('syncing');
  document.getElementById('sync-status').innerText = 'Completing organization...';
  chrome.runtime.sendMessage({ action: "UNCATEGORIZED_RESOLVED", resolutions });
});
```

**Step 2: Add placeholder listener hooks in background.js**
We must register matching listener hooks in [background.js](file:///c:/Users/bert_/Desktop/MusicOrginizer/src/background/background.js) to avoid deadlocks:
```javascript
// Add inside background.js runtime message listener
  } else if (request.action === "DUPLICATES_RESOLVED") {
    console.log("Duplicates selected for removal:", request.idsToDelete);
    // Resume flow after mock deletion
    chrome.runtime.sendMessage({ action: "UPDATE_PROGRESS", status: "Finishing sorting...", percent: 80 });
    setTimeout(() => {
      chrome.runtime.sendMessage({ 
        action: "ORGANIZATION_COMPLETE", 
        stats: { organized: 2, playlists: 1, duplicates: request.idsToDelete.length } 
      });
    }, 1000);
  } else if (request.action === "UNCATEGORIZED_RESOLVED") {
    console.log("Uncategorized tracks resolved:", request.resolutions);
    chrome.runtime.sendMessage({ action: "UPDATE_PROGRESS", status: "Creating playlists...", percent: 90 });
    setTimeout(() => {
      chrome.runtime.sendMessage({ 
        action: "ORGANIZATION_COMPLETE", 
        stats: { organized: request.resolutions.length, playlists: 2, duplicates: 0 } 
      });
    }, 1000);
  }
```

**Step 3: Commit**
```bash
git add src/popup/popup.js src/background/background.js
git commit -m "feat: wire messaging hooks for duplicates and uncategorized resolution"
```
