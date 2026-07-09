document.getElementById("open-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: GBI_URL });
});

document.getElementById("shortcut-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
