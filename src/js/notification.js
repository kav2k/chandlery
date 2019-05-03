/* exported showNotification, showUpdateNotification */

function showNotification(notifications) {
  if (notifications.length) {
    let message = "";
    let count = "";
    let stale = true;

    notifications.forEach(function(notification) {
      switch (notification.type) {
        case "actionsFull":
          count = notification.count + ((notification.count - 1) ? " actions" : " action");
          message += "Your actions candle is full! (" + count + ")\n";
          break;
        case "actionsThreshold":
          count = notification.count + ((notification.count - 1) ? " actions" : " action");
          message += "Your actions candle is over threshold! (" + count + ")\n";
          break;
        case "cardsFull":
          count = notification.count + ((notification.count - 1) ? " cards" : " card");
          message += "Your Opportunity deck is full! (" + count + ")\n";
          break;
        case "cardsThreshold":
          count = notification.count + ((notification.count - 1) ? " cards" : " card");
          message += "Your Opportunity deck is over threshold! (" + count + ")\n";
          break;
      }
      stale = stale && notification.stale;
    });

    createOrUpdate({
      id: "chandleryNotify",
      reshow: !stale,
      type: "basic",
      iconUrl: "img/icon128.png",
      title: "Fallen London Chandlery",
      message: message.trim(),
      buttons: [
        {title: "Options"}
      ]
    });
  } else {
    chrome.notifications.clear("chandleryNotify");
    chrome.storage.local.set({lastNotifications: {}});
  }
}

function showUpdateNotification() {
  createOrUpdate({
    id: "chandleryUpdate",
    reshow: true,
    type: "basic",
    iconUrl: "img/icon128.png",
    title: "Fallen London Chandlery",
    message: "New options are available!\nClick to open Options page."
  });
}

// UTILITY FUNCTIONS

function createOrUpdate(options, callback) {
  callback = callback || function() {};

  const id = options.id;
  delete options.id;

  const reshow = options.reshow;
  delete options.reshow;
  if (!reshow) { return; }

  let targetPriority = options.priority || 0;

  chrome.notifications.update(id, {priority: targetPriority}, function(existed) {
    if (existed) {
      if (reshow) {
        targetPriority = options.priority || 0;
        options.priority = 1;
        // Update with higher priority
        chrome.notifications.update(id, options, function() {
          chrome.notifications.update(id, {priority: targetPriority}, function() {
            callback(true); // Updated
          });
        });
      } else {
        chrome.notifications.update(id, options, function() {
          callback(true); // Updated
        });
      }
    } else {
      chrome.notifications.create(id, options, function() {
        callback(false); // Created
      });
    }
  });
}

// EVENT LISTENERS

chrome.notifications.onClicked.addListener(function(notificationId) {
  switch (notificationId) {
    case "chandleryNotify":
      chrome.tabs.query({url: "https://fallenlondon.com/*"}, function(tabs) {
        if (tabs.length) {
          chrome.tabs.update(tabs[0].id, {active: true});
          chrome.windows.update(tabs[0].windowId, {focused: true});
        } else {
          chrome.tabs.create({url: "https://fallenlondon.com/"});
        }
      });
      chrome.notifications.clear("chandleryNotify");
      break;
    case "chandleryUpdate":
      chrome.runtime.openOptionsPage();
      chrome.notifications.clear("chandleryUpdate");
      break;
  }
});

chrome.notifications.onButtonClicked.addListener(
  function() {
    chrome.runtime.openOptionsPage();
  }
);
