function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

async function getSapisidHash() {
  const sapisid = getCookie('SAPISID');
  if (!sapisid) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const msg = `${timestamp} ${sapisid} https://music.youtube.com`;
  const msgBuffer = new TextEncoder().encode(msg);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `SAPISIDHASH ${timestamp}_${hashHex}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PROXY_POST") {
    const { url, payload } = request;
    
    (async () => {
      try {
        const authHeader = await getSapisidHash();
        const headers = {
          'Content-Type': 'application/json'
        };
        if (authHeader) headers['Authorization'] = authHeader;

        const res = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: headers,
          body: JSON.stringify(payload)
        });

        const text = await res.text();
        if (!res.ok) {
          sendResponse({ error: `HTTP error! status: ${res.status}`, details: text });
        } else {
          sendResponse({ data: JSON.parse(text) });
        }
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    
    return true; // Keep message channel open for asynchronous sendResponse
  }
});
