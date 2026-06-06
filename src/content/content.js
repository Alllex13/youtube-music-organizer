chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PROXY_POST") {
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
