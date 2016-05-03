// SYNC

var syncableOptions = [
  "notifyActionsMode",
  "notifyActionsThresholdValue",
  "notifyCardsMode",
  "notifyCardsThresholdValue",
  "storage_schema",
  "update_notification"
];

// LOCAL <-> SYNC MACHINERY
// Adapted from http://stackoverflow.com/a/29064381/934239

// Although we're using an event page,
// this state information does not need to survive unloading
var timeout;
var queuedChanges = {};
var syncStamp = 1;

chrome.storage.onChanged.addListener(function(changes, area) {
  chrome.storage.local.get(["syncOverride"], function(data) {
    // If sync should be ignored, ignore it
    if (data.syncOverride) { return; }

    // Check if it's an echo of our changes
    if (changes._syncStamp && changes._syncStamp.newValue == syncStamp) {
      return;
    }

    if (area == "local") {
      // Change in local storage: queue a flush to sync

      // Filter out syncable properties
      var filteredChanges = {};
      var syncable = false;

      for (let key of syncableOptions) {
        if (typeof changes[key] != "undefined") {
          filteredChanges[key] = changes[key];
          syncable = true;
        }
      }

      // Nothing to sync
      if (!syncable) { return; }

      // Reset timeout
      if (timeout) { clearTimeout(timeout); }

      // Merge changes with already queued ones
      for (let key in filteredChanges) {
        // Just overwrite old change; we don't care about last newValue
        queuedChanges[key] = filteredChanges[key];
      }

      // Schedule flush
      timeout = setTimeout(flushToSync, 3000);

    } else {
      // Change in sync storage: copy to local

      if (changes._syncStamp && changes._syncStamp.newValue) {
        // Ignore those changes when they echo as local
        syncStamp = changes._syncStamp.newValue;
      }
      commitChanges(changes, chrome.storage.local);
    }

  });
});

function flushToSync() {
  // Be mindful of what gets synced: there are also size quotas
  // If needed, filter queuedChanges here

  // Generate a new sync stamp
  // With random instead of sequential, there's a really tiny chance
  //   changes will be ignored, but no chance of stamp overflow
  syncStamp = Math.random();
  queuedChanges._syncStamp = {newValue: syncStamp};

  // Process queue for committing
  commitChanges(queuedChanges, chrome.storage.sync);

  // Reset queue
  queuedChanges = {};
  timeout = undefined;
}

function commitChanges(changes, storage) {
  var setData = {};

  for (var key in changes) {
    setData[key] = changes[key].newValue;
  }

  storage.set(setData, function() {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    }
  });
}
