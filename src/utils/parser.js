function parseGenreFromDOM(htmlString) {
  // Simplified for unit test; in reality, we'll parse JSON state or query DOM nodes
  const match = htmlString.match(/class="genre-text">([^<]+)<\//);
  return match ? match[1] : null;
}

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

module.exports = { parseGenreFromDOM, extractYtcfg };
