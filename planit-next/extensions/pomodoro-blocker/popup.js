const urlInput = document.getElementById('urlInput');
const addBtn = document.getElementById('addBtn');
const siteList = document.getElementById('siteList');

function renderList(sites) {
  siteList.innerHTML = '';
  sites.forEach((site, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${site}</span>
      <button class="remove" data-index="${index}">X</button>
    `;
    siteList.appendChild(li);
  });
}

// Load saved sites on open
chrome.storage.local.get({ blockedSites: [] }, (result) => {
  renderList(result.blockedSites);
});

addBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) return;

  chrome.storage.local.get({ blockedSites: [] }, (result) => {
    const updated = [...result.blockedSites, url];
    chrome.storage.local.set({ blockedSites: updated }, () => {
      urlInput.value = '';
      renderList(updated);
    });
  });
});

siteList.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove')) {
    const index = e.target.getAttribute('data-index');
    chrome.storage.local.get({ blockedSites: [] }, (result) => {
      const updated = result.blockedSites.filter((_, i) => i != index);
      chrome.storage.local.set({ blockedSites: updated }, () => renderList(updated));
    });
  }
});
