importScripts('api.js');

let autoSyncEnabled = false;
let ytmClient = null;

function safeSendMessage(message) {
  chrome.runtime.sendMessage(message).catch(err => {
    console.log("Popup message omitted (popup closed):", message.action);
  });
}

function safeSendTabMessage(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(err => {
    console.warn("Content script is not active on tab, attempting dynamic injection:", tabId, err.message);
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/content/content.js']
    }).then(() => {
      console.log("Successfully injected content script dynamically into tab:", tabId);
      // Wait 100ms for script registration and retry sending message
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, message).catch(retryErr => {
          console.error("Retry sending message failed:", retryErr.message);
        });
      }, 100);
    }).catch(injectErr => {
      console.error("Failed to inject content script dynamically:", injectErr.message);
    });
  });
}

function startOrchestration(config, playlistId) {
  ytmClient = new YTMClient(config);
  
  // The Full Orchestration Flow
  (async () => {
    try {
      safeSendMessage({ action: "UPDATE_PROGRESS", status: "Fetching source playlist...", percent: 25 });
      const playlist = await ytmClient.fetchPlaylist(playlistId);
      
      safeSendMessage({ action: "UPDATE_PROGRESS", status: `Fetching genres for ${playlist.tracks.length} tracks...`, percent: 50 });
      const genres = await Promise.all(playlist.tracks.map(t => ytmClient.fetchTrackGenre(t.videoId)));
      
      safeSendMessage({ action: "UPDATE_PROGRESS", status: "Creating destination playlist for Rock...", percent: 75 });
      const newPlaylistId = await ytmClient.createPlaylist("Genre: Rock");
      
      safeSendMessage({ action: "UPDATE_PROGRESS", status: "Moving tracks to new playlist...", percent: 90 });
      await ytmClient.addTracksToPlaylist(newPlaylistId, playlist.tracks.map(t => t.videoId));
      
      console.log("✅ Organization Complete!");
      safeSendMessage({ 
        action: "ORGANIZATION_COMPLETE", 
        stats: { organized: playlist.tracks.length, playlists: 1, duplicates: 0 } 
      });
    } catch (err) {
      console.error("Orchestration Failed:", err);
      safeSendMessage({ action: "UPDATE_PROGRESS", status: `Error: ${err.message}`, percent: 0 });
    }
  })();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "START_ORGANIZING") {
    chrome.tabs.query({url: "*://music.youtube.com/*"}, (tabs) => {
      if(tabs.length === 0) return console.error("No YouTube Music tab found.");
      const tabId = tabs[0].id;

      // Ensure content script is active by sending a PING
      chrome.tabs.sendMessage(tabId, { action: "PING" }).catch(err => {
        console.warn("Content script is not active, injecting dynamically first...", err.message);
        return chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['src/content/content.js']
        });
      }).then(() => {
        // Extract ytcfg from the main world safely (does not violate page CSP)
        return chrome.scripting.executeScript({
          target: { tabId: tabId },
          world: 'MAIN',
          func: () => {
            if (typeof window.ytcfg === 'undefined') return null;
            try {
              return {
                INNERTUBE_API_KEY: window.ytcfg.get('INNERTUBE_API_KEY'),
                CLIENT_VERSION: window.ytcfg.get('CLIENT_VERSION'),
                INNERTUBE_CONTEXT: window.ytcfg.get('INNERTUBE_CONTEXT')
              };
            } catch (e) {
              return null;
            }
          }
        });
      }).then(results => {
        if (results && results[0] && results[0].result) {
          const config = results[0].result;
          startOrchestration(config, request.playlistId);
        } else {
          console.error("Could not find ytcfg on page.");
          safeSendMessage({ action: "UPDATE_PROGRESS", status: "Error: Could not retrieve YouTube Music context.", percent: 0 });
        }
      }).catch(err => {
        console.error("Initialization failed:", err.message);
        safeSendMessage({ action: "UPDATE_PROGRESS", status: `Error: ${err.message}`, percent: 0 });
      });
    });
  } else if (request.action === "CONFIG_EXTRACTED") {
    startOrchestration(request.config, request.playlistId);
  } else if (request.action === "UPDATE_SYNC_SETTINGS") {
    autoSyncEnabled = request.autoSync;
    sendResponse({ success: true });
  } else if (request.action === "DUPLICATES_RESOLVED") {
    console.log("Duplicates selected for removal:", request.idsToDelete);
    // Resume flow after mock deletion
    safeSendMessage({ action: "UPDATE_PROGRESS", status: "Finishing sorting...", percent: 80 });
    setTimeout(() => {
      safeSendMessage({ 
        action: "ORGANIZATION_COMPLETE", 
        stats: { organized: 2, playlists: 1, duplicates: request.idsToDelete.length } 
      });
    }, 1000);
  } else if (request.action === "UNCATEGORIZED_RESOLVED") {
    console.log("Uncategorized tracks resolved:", request.resolutions);
    safeSendMessage({ action: "UPDATE_PROGRESS", status: "Creating playlists...", percent: 90 });
    setTimeout(() => {
      safeSendMessage({ 
        action: "ORGANIZATION_COMPLETE", 
        stats: { organized: request.resolutions.length, playlists: 2, duplicates: 0 } 
      });
    }, 1000);
  }
});

chrome.webRequest.onCompleted.addListener((details) => {
    if (autoSyncEnabled && details.url.includes('like/like')) {
      console.log('New song liked! Auto-sync triggered.');
    }
  },
  { urls: ["*://music.youtube.com/youtubei/v1/like/like*"] }
);
