function parseGenreFromDOM(htmlString) {
  // Simplified for unit test; in reality, we'll parse JSON state or query DOM nodes
  const match = htmlString.match(/class="genre-text">([^<]+)<\//);
  return match ? match[1] : null;
}
module.exports = { parseGenreFromDOM };
