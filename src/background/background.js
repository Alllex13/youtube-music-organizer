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
