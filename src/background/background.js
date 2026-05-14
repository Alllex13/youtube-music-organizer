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
