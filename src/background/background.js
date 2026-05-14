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
    
    // The Full Orchestration Flow
    (async () => {
      try {
        console.log("1. Fetching source playlist...");
        const playlist = await ytmClient.fetchPlaylist(request.playlistId);
        
        console.log(`2. Fetching genres for ${playlist.tracks.length} tracks...`);
        const genres = await Promise.all(playlist.tracks.map(t => ytmClient.fetchTrackGenre(t.videoId)));
        
        console.log("3. Creating destination playlist for Rock...");
        const newPlaylistId = await ytmClient.createPlaylist("Genre: Rock");
        
        console.log("4. Moving tracks to new playlist...");
        await ytmClient.addTracksToPlaylist(newPlaylistId, playlist.tracks.map(t => t.videoId));
        
        console.log("✅ Organization Complete!");
        // Future step: send ORGANIZATION_COMPLETE message to popup UI
      } catch (err) {
        console.error("Orchestration Failed:", err);
      }
    })();
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
