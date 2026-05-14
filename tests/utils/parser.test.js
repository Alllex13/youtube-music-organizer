const { parseGenreFromDOM } = require('../../src/utils/parser');

test('parseGenreFromDOM extracts genre text', () => {
  // Mocking the YTM DOM structure for a song info panel
  const mockDOM = `<div><yt-formatted-string class="genre-text">Pop/Rock</yt-formatted-string></div>`;
  const result = parseGenreFromDOM(mockDOM);
  expect(result).toBe('Pop/Rock');
});
