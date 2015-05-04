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

function showNotification(notifications) {
  if(notifications.length) {

    var message = "";

    notifications.forEach(function(notification) {
      switch(notification.type) {
        case "actionsFull":
          message += "Your actions candle is full! ("
            + notification.count
            + ((notification.count - 1) ? " actions" : " action")
            + ")\n";
          break;
        case "cardsFull":
          message += "Your Opportunity deck is full! ("
            + notification.count
            + ((notification.count - 1) ? " cards" : " cards")
            + ")\n";
          break;
      }
    });

    createOrUpdate("chandleryNotify", {
      type: "basic",
      iconUrl: "img/icon128.png",
      title: "Fallen London Chandlery",
      message: message.trim(),
      buttons: [
        {title: "Options"}
      ]
    })

  } else {
    chrome.notifications.clear("chandleryNotify");
  }
}

function createOrUpdate(id, options, callback) {
  callback = callback || function() {};
  chrome.notifications.update(id, { priority: 0 }, function(existed) {
    if(existed) {
      var targetPriority = options.priority || 0;
      options.priority = 1;
      // Update with higher priority
      chrome.notifications.update(id, options, function() {
        chrome.notifications.update(id, { priority: targetPriority }, function() {
          callback(true); // Updated
        });
      });
    } else {
      chrome.notifications.create(id, options, function() {
        callback(false); // Created
      });
    }
  });
}

chrome.notifications.onButtonClicked.addListener(
  function(notificationId, buttonIndex) {
    chrome.runtime.openOptionsPage();
  }
);

chrome.notifications.onClicked.addListener(function(notificationId) {
  switch(notificationId) {
    case "chandleryNotify":
      chrome.storage.local.get("lastTabId", function(options) {
        if(options.lastTabId) {
          chrome.tabs.sendMessage(
            options.lastTabId,
            {command: "pingFocus"},
            function(response) {
              if(chrome.runtime.lastError) {
                console.log("No response from last known tab");
                chrome.tabs.create({url: "http://http://fallenlondon.storynexus.com/"});
              }
            }
          );
        } else {
          chrome.tabs.create({url: "http://http://fallenlondon.storynexus.com/"});
        }
      });
      chrome.notifications.clear("chandleryNotify");
      break;
  }
});

chrome.runtime.onInstalled.addListener(function() {
  var defaults = {
    notifyActionsFull: true,
    notifyCardsFull: false
  };

  chrome.storage.local.get(defaults, function(options) {
    chrome.storage.local.set(options);
  });
});