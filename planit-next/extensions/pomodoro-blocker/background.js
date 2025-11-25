let currentState = "paused";

chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.source !== "planit-pomodoro") return;

  currentState = message.state;
  console.log("Pomodoro state changed:", currentState);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url || currentState !== "focus") return;

  chrome.storage.local.get({ blockedSites: [] }, (result) => {
    const url = changeInfo.url.toLowerCase();

    if (result.blockedSites.some(site => url.includes(site.toLowerCase()))) {
      chrome.tabs.update(tabId, { url: "chrome://newtab/" });
    }
  });
});
