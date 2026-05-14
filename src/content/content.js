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
