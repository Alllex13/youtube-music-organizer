const { findDuplicates } = require('../../src/utils/deduplicator');

test('findDuplicates identifies tracks with same title and artist', () => {
  const tracks = [
    { id: '1', title: 'Song A', artist: 'Artist 1' },
    { id: '2', title: 'Song B', artist: 'Artist 2' },
    { id: '3', title: 'Song A', artist: 'Artist 1' }
  ];
  const duplicates = findDuplicates(tracks);
  expect(duplicates.length).toBe(1);
  expect(duplicates[0]).toEqual(expect.arrayContaining([tracks[0], tracks[2]]));
});
