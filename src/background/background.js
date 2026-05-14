let autoSyncEnabled = false;

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
  } else if (request.action === "UPDATE_SYNC_SETTINGS") {
    autoSyncEnabled = request.autoSync;
    sendResponse({ success: true });
  }
});

// Listener for tracking web requests to the YouTube Music "Like" endpoint
chrome.webRequest.onCompleted.addListener((details) => {
    if (autoSyncEnabled && details.url.includes('like/like')) {
      console.log('New song liked! Auto-sync triggered.');
      // Extract video ID from request body/url and queue for organization
    }
  },
  { urls: ["*://music.youtube.com/youtubei/v1/like/like*"] }
);
