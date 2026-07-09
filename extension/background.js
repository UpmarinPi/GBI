importScripts("shared.js");

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-gbi") {
    chrome.tabs.create({ url: GBI_URL });
  }
});
