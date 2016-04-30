// MESSAGE LISTENERS

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.command) {
    case "notify":
      var notifications = [];
      var actions = message.actions;
      var cards = message.cards;
      chrome.storage.local.get(null, function(options) {
        if (options.notifyActionsFull && actions.known && actions.full) {
          notifications.push({type: "actionsFull", count: actions.current});
        }
        if (options.notifyCardsFull && cards.known && cards.full) {
          notifications.push({type: "cardsFull", count: cards.current});
        }
        showNotification(notifications);
      });
      break;
  }
});

// INSTALL/UPDATE HANDLING

function reinjectContentScripts() {
  var contentScripts = ["js/lib/mutation-summary.js", "js/content.js"];

  chrome.tabs.query({url: "http://fallenlondon.storynexus.com/Gap/Load*"}, function(tabs) {
    tabs.forEach(function(tab) {
      for (var file of contentScripts) {
        chrome.tabs.executeScript(tab.id, {file: file});
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(function() {
  var defaults = {
    notifyActionsFull: true,
    notifyCardsFull: false,
    syncOverride: false
  };

  chrome.storage.local.get(defaults, function(options) {
    chrome.storage.local.set(options, function() {
      // Try to reinject into all open FL tabs
      reinjectContentScripts();
    });
  });
});
