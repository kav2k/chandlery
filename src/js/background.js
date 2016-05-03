// MESSAGE LISTENERS

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.command) {
    case "notify":
      var notifications = [];
      var actions = message.actions;
      var cards = message.cards;
      chrome.storage.local.get(null, function(options) {
        if ((options.notifyActionsMode === "notifyActionsFull" || options.notifyActionsMode === "notifyActionsThreshold") && actions.known && actions.full) {
          notifications.push({
            type: "actionsFull",
            count: actions.current,
            stale: options.lastKnown.actions.full
          });
        } else if (options.notifyActionsMode === "notifyActionsThreshold" && actions.known && actions.current >= options.notifyActionsThresholdValue) {
          notifications.push({
            type: "actionsThreshold",
            count: actions.current,
            stale: options.lastKnown.actions.current >= options.notifyActionsThresholdValue
          });
        }
        if ((options.notifyCardsMode === "notifyCardsFull" || options.notifyActionsMode === "notifyCardsThreshold") && cards.known && cards.full) {
          notifications.push({
            type: "cardsFull",
            count: cards.current,
            stale: options.lastKnown.cards.full
          });
        } else if (options.notifyCardsMode === "notifyCardsThreshold" && cards.known && cards.current >= options.notifyCardsThresholdValue) {
          notifications.push({
            type: "cardsThreshold",
            count: cards.current,
            stale: options.lastKnown.cards.current >= options.notifyCardsThresholdValue
          });
        }
        showNotification(notifications);

        var lastKnown = options.lastKnown;
        if (actions.known) {
          lastKnown.actions = actions;
        }
        if (cards.known) {
          lastKnown.cards = cards;
        }

        chrome.storage.local.set({lastKnown: lastKnown});
      });
      break;
  }
});

// INSTALL/UPDATE HANDLING

function reinjectContentScripts() {
  var contentScripts = ["js/lib/mutation-summary.js", "js/content.js"];

  function silenceErrors() {
    if (chrome.runtime.lastError) { return; } // Silence access errors for reinjection
  }

  // This query will actually work properly in Chrome 50+ and did not work in 49
  chrome.tabs.query({url: "http://fallenlondon.storynexus.com/Gap/Load*"}, function(tabs) {
    tabs.forEach(function(tab) {
      for (let file of contentScripts) {
        chrome.tabs.executeScript(tab.id, {file: file}, silenceErrors);
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(function(details) {
  var defaults = {
    notifyActionsMode: "notifyActionsFull",
    notifyCardsMode: "notifyCardsDisabled",

    notifyActionsThresholdValue: 10,
    notifyCardsThresholdValue: 5,

    syncOverride: false,
    lastKnown: {
      actions: {},
      cards: {}
    },

    storage_schema: 0, // Next one should be 2!
    update_notification: 0 // No need to change here
  };

  var update_notification_latest = 1;

  chrome.storage.local.get(defaults, function(options) {

    function commit(data) {
      chrome.storage.local.set(data, function() {
        // Try to reinject into all open FL tabs
        reinjectContentScripts();
      });
    }

    if (options.update_notification < update_notification_latest) {
      options.update_notification = update_notification_latest;
      if (details.reason === "update") {
        showUpdateNotification();
      }
    }

    switch (options.storage_schema) { // Migration
      case 0:
        chrome.storage.local.get({notifyActionsFull: true, notifyCardsFull: false}, function(more_data) {
          options.notifyActionsMode = (more_data.notifyActionsFull) ? "notifyActionsFull" : "notifyActionsDisabled";
          options.notifyCardsMode = (more_data.notifyCardsFull) ? "notifyCardsFull" : "notifyCardsDisabled";
          options.storage_schema = 1;
          commit(options);
        });
        return;
    }

    commit(options);
  });
});
