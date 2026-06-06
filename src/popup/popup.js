const cards = {
  setup: document.getElementById('card-setup'),
  duplicates: document.getElementById('card-duplicates'),
  syncing: document.getElementById('card-syncing'),
  uncategorized: document.getElementById('card-uncategorized'),
  report: document.getElementById('card-report')
};

let activeCardKey = 'setup';

function showCard(targetKey) {
  Object.keys(cards).forEach(key => {
    const card = cards[key];
    if (key === targetKey) {
      card.className = 'card active';
    } else if (key === activeCardKey) {
      card.className = 'card slide-out-left';
    } else {
      card.className = 'card slide-in-right';
    }
  });
  activeCardKey = targetKey;
}

// Bind Home/Reset Actions
document.getElementById('home-btn').addEventListener('click', () => {
  showCard('setup');
});

// Bind Start Action
document.getElementById('start-btn').addEventListener('click', () => {
  const playlistId = document.getElementById('playlist-select').value;
  const autoSync = document.getElementById('auto-sync').checked;
  showCard('syncing');
  document.getElementById('sync-status').innerText = 'Initializing connection...';
  document.getElementById('progress-bar').style.width = '10%';
  
  // Request background to start sorting
  chrome.runtime.sendMessage({ action: "START_ORGANIZING", playlistId, autoSync });
});
