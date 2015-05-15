// MESSAGE LISTENERS

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch(message.command) {
    case "notify":
      var notifications = [];
      var actions = message.actions;
      var cards = message.cards;
      chrome.storage.local.set({lastTabId : sender.tab.id}, function() {
        chrome.storage.local.get(null, function(options) {
          if(options.notifyActionsFull && actions.known && actions.full) {
            notifications.push({type : "actionsFull", count : actions.current });
          }
          if(options.notifyCardsFull && cards.known && cards.full) {
            notifications.push({type : "cardsFull", count: cards.current });
          }
          showNotification(notifications);
        });
      });
      break;
    case "focus":
      chrome.tabs.update(sender.tab.id, {active: true});
      chrome.windows.update(sender.tab.windowId, {focused: true});
      break;
  }
});

// INSTALL/UPDATE HANDLING

chrome.runtime.onInstalled.addListener(function() {
  var defaults = {
    notifyActionsFull: true,
    notifyCardsFull: false,
    syncOverride: false
  };

  chrome.storage.local.get(defaults, function(options) {
    chrome.storage.local.set(options);
  });
});
