let currentState = "paused";

chrome.runtime.onMessage.addListener((message) => {
  if (message.source === "planit-pomodoro") {
    currentState = message.state;
    console.log("Pomodoro state changed to:", currentState);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && currentState === "focus") {
    chrome.storage.local.get({ blockedSites: [] }, (result) => {
      const url = changeInfo.url.toLowerCase();
      if (result.blockedSites.some(site => url.includes(site.toLowerCase()))) {
        chrome.tabs.update(tabId, { url: "chrome://newtab/" });
      }
    });
  }
});
