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

// Render duplicate track selection list
function renderDuplicates(duplicateGroups) {
  const container = document.getElementById('duplicates-list');
  container.innerHTML = '';
  
  duplicateGroups.forEach((group, index) => {
    const groupDiv = document.createElement('div');
    groupDiv.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    groupDiv.style.padding = '8px 0';
    
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.fontSize = '13px';
    title.innerText = group[0].title;
    groupDiv.appendChild(title);
    
    group.forEach(track => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.fontSize = '12px';
      label.style.color = '#A0A0A0';
      label.style.margin = '4px 0';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = `dup-group-${index}`;
      checkbox.value = track.id;
      checkbox.style.marginRight = '8px';
      // Auto-check first option to keep, others unchecked for deletion
      checkbox.checked = false; 
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(`${track.artist} (${track.id})`));
      groupDiv.appendChild(label);
    });
    container.appendChild(groupDiv);
  });
  
  showCard('duplicates');
}

// Render Uncategorized songs checklist
function renderUncategorized(tracks) {
  const container = document.getElementById('uncategorized-list');
  container.innerHTML = '';
  
  tracks.forEach(track => {
    const trackDiv = document.createElement('div');
    trackDiv.style.marginBottom = '10px';
    
    const label = document.createElement('div');
    label.style.fontSize = '12px';
    label.style.fontWeight = 'bold';
    label.innerText = `${track.title} - ${track.artist}`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g. Rock, Jazz, Pop';
    input.className = 'uncat-input';
    input.dataset.trackId = track.videoId;
    input.style.marginTop = '4px';
    
    trackDiv.appendChild(label);
    trackDiv.appendChild(input);
    container.appendChild(trackDiv);
  });
  
  showCard('uncategorized');
}
