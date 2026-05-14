class YTMClient {
  constructor(config) {
    this.key = config.INNERTUBE_API_KEY;
    this.version = config.CLIENT_VERSION;
    this.clientName = '69'; // WEB_REMIX (YouTube Music)
    // We must pass the raw ytcfg object context in the body of requests
    this.context = {
      client: {
        clientName: this.clientName,
        clientVersion: this.version
      }
    };
  }

  async _post(endpoint, body = {}) {
    const url = `https://music.youtube.com/youtubei/v1/${endpoint}?key=${this.key}`;
    const payload = { context: this.context, ...body };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`API HTTP Error: ${response.status}`);
    return await response.json();
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
