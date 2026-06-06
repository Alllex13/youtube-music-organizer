class YTMClient {
  constructor(config) {
    this.key = config.INNERTUBE_API_KEY;
    this.version = config.CLIENT_VERSION;
    this.clientName = 'WEB_REMIX'; 
    this.context = config.INNERTUBE_CONTEXT;
  }

  async getCookie(url, name) {
    try {
      return await chrome.cookies.get({ url, name });
    } catch (e) {
      console.warn(`Cookie access blocked for ${url}`, e);
      return null;
    }
  }

  async getSapisidHash() {
    const cookie = await this.getCookie('https://youtube.com', 'SAPISID') || 
                   await this.getCookie('https://music.youtube.com', 'SAPISID');
    console.log("SAPISID Cookie found:", !!cookie);
    if (!cookie) return null;
    const sapisid = cookie.value;
    const timestamp = Math.floor(Date.now() / 1000);
    const msg = `${timestamp} ${sapisid} https://music.youtube.com`;
    const msgBuffer = new TextEncoder().encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const finalHash = `SAPISIDHASH ${timestamp}_${hashHex}`;
    console.log("Generated Hash:", finalHash);
    return finalHash;
  }

  async _post(endpoint, body = {}) {
    const url = `https://music.youtube.com/youtubei/v1/${endpoint}?key=${this.key}`;
    const payload = { context: this.context, ...body };

    return new Promise((resolve, reject) => {
      chrome.tabs.query({url: "*://music.youtube.com/*"}, (tabs) => {
        if (tabs.length === 0) {
          return reject(new Error("No YouTube Music tab found."));
        }
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "PROXY_POST",
          url,
          payload
        }, (response) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (!response) {
            return reject(new Error("No response from content script proxy."));
          }
          if (response.error) {
            console.error("Proxy POST failed:", response.error, response.details);
            return reject(new Error(response.error));
          }
          resolve(response.data);
        });
      });
    });
  }

  async fetchPlaylist(playlistId) {
    console.log(`Fetching playlist ${playlistId}...`);
    const data = await this._post('browse', { browseId: `VL${playlistId}` });
    // In reality, this requires complex JSON path parsing to extract track IDs.
    // For this MVP, we will simulate the parsing logic returning dummy track IDs.
    console.log("Browse API returned:", data ? "Success" : "Failed");
    return { tracks: [{ videoId: "dummy_id_1" }, { videoId: "dummy_id_2" }] };
  }

  async fetchTrackGenre(videoId) {
    // The 'next' endpoint loads the player queue and info panel
    const data = await this._post('next', { videoId });
    // Simulate genre extraction from the massive JSON response
    return "Rock"; // MVP placeholder
  }

  async createPlaylist(title, description = "") {
    const data = await this._post('playlist/create', { title, description });
    return data.playlistId || "new_playlist_id"; // Extracted from response
  }

  async addTracksToPlaylist(playlistId, videoIds) {
    const actions = videoIds.map(id => ({
      action: "ACTION_ADD_VIDEO",
      addedVideoId: id
    }));
    const data = await this._post('browse/edit_playlist', {
      playlistId: `VL${playlistId}`,
      actions
    });
    return data;
  }
}

if (typeof module !== 'undefined') module.exports = { YTMClient };
