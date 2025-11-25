window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== "planit-pomodoro") return;

  chrome.runtime.sendMessage(event.data);
});
