window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data?.source === "planit-pomodoro") return;
  chrome.runtime.sendMessage(event.data);
});
