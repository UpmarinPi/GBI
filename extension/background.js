const GBI_URL = "https://upmarinpi.github.io/GBI/";

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-gbi") {
    chrome.tabs.create({ url: GBI_URL });
  }
});
