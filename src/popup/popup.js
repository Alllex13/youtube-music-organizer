document.getElementById('start-btn').addEventListener('click', () => {
  const playlistId = document.getElementById('playlist-select').value;
  const autoSync = document.getElementById('auto-sync').checked;
  document.getElementById('status').innerText = 'Initializing...';
  chrome.runtime.sendMessage({ action: "START_ORGANIZING", playlistId, autoSync });
});
