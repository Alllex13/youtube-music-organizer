chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_PLAYLIST") {
    console.log("Fetching playlist data for ID:", request.playlistId);
    
    // Inject script to extract ytcfg from the page's main world context
    const script = document.createElement('script');
    script.textContent = `
      try {
        document.documentElement.setAttribute('data-ytcfg', JSON.stringify({
          INNERTUBE_API_KEY: window.ytcfg.get('INNERTUBE_API_KEY'),
          CLIENT_VERSION: window.ytcfg.get('CLIENT_VERSION'),
          INNERTUBE_CONTEXT: window.ytcfg.get('INNERTUBE_CONTEXT')
        }));
      } catch (e) {
        console.error("Failed to extract ytcfg from main world:", e);
      }
    `;
    document.documentElement.appendChild(script);
    script.remove();

    const configStr = document.documentElement.getAttribute('data-ytcfg');
    document.documentElement.removeAttribute('data-ytcfg');

    if (configStr) {
      const config = JSON.parse(configStr);
      chrome.runtime.sendMessage({ action: "CONFIG_EXTRACTED", config, playlistId: request.playlistId });
      sendResponse({ status: "started" });
    } else {
      sendResponse({ status: "error", message: "Could not find ytcfg via main world injection" });
    }
  } else if (request.action === "PROXY_POST") {
    // Perform fetch from content script context (same-origin, cookies attached)
    const { url, payload } = request;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      const text = await res.text();
      if (!res.ok) {
        sendResponse({ error: `HTTP error! status: ${res.status}`, details: text });
      } else {
        sendResponse({ data: JSON.parse(text) });
      }
    })
    .catch(err => {
      sendResponse({ error: err.message });
    });
    return true; // Keep message channel open for asynchronous sendResponse
  }
});
