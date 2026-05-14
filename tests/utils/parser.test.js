const { parseGenreFromDOM, extractYtcfg } = require('../../src/utils/parser');

test('parseGenreFromDOM extracts genre text', () => {
  // Mocking the YTM DOM structure for a song info panel
  const mockDOM = `<div><yt-formatted-string class="genre-text">Pop/Rock</yt-formatted-string></div>`;
  const result = parseGenreFromDOM(mockDOM);
  expect(result).toBe('Pop/Rock');
});

test('extractYtcfg parses configuration object from HTML', () => {
  const mockHTML = `<html><head><script>ytcfg.set({"INNERTUBE_API_KEY":"testKey","CLIENT_VERSION":"1.0","SAPISIDHASH":"testHash"});</script></head><body></body></html>`;
  const config = extractYtcfg(mockHTML);
  expect(config.INNERTUBE_API_KEY).toBe('testKey');
});
