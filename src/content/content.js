chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_PLAYLIST") {
    console.log("Fetching playlist data for ID:", request.playlistId);
    // In actual implementation, this will query the ytInitialData or fetch internal API
    sendResponse({ status: "started" });
  }
});
