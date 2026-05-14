function findDuplicates(tracks) {
  const groups = {};
  tracks.forEach(track => {
    const key = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(track);
  });
  return Object.values(groups).filter(group => group.length > 1);
}
module.exports = { findDuplicates };
