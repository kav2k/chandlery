// ACTIONS

function getActions() {
  var actionsElement = document.getElementById("infoBarCurrentActions");
  if(!actionsElement) {
    return {known: false};
  }
  var actionsText = actionsElement.parentElement.textContent; // Contains e.g. "4/20"
  var match = actionsText.match(/(\d+)\/(\d+)/);
  if(match) {
    return {
      known: true,
      current: parseInt(match[1]),
      total: parseInt(match[2]),
      full: parseInt(match[1]) == parseInt(match[2])
    }
  } else {
    return {known: false};
  }
}

function actionsChange() {
  var state = {actions: getActions(), cards: getCards()};
  setTitle(state);
  notifyBackground(state);
}

var actionsObserver = watchForChange(
  "lhs_col",
  "infoBarCurrentActions",
  actionsChange
);

// CARDS

function getCards() {
  var cardsElement = document.getElementById("card_deck");
  if(!cardsElement) {
    return {known: false};
  }
  var cardsText = cardsElement.parentElement.textContent; // Contains e.g. "4/20"
  var match = cardsText.match(/(\d+|No) cards? waiting/);
  if(match) {
    return {
      known: true,
      current: (match[1] == "No") ? 0 : parseInt(match[1]),
      full: !cardsText.match(/Another in/)
    }
  } else {
    return {known: false};
  }
}

function cardsChange() {
  var state = {actions: getActions(), cards: getCards()};
  setTitle(state);
  notifyBackground(state);
}

var cardsObserver = watchForChange(
  "rhs_col",
  "deck-contents-description",
  cardsChange
);

// OBSERVER FUNCTIONS

function watchForChange(rootId, marker, callback) {
  var observer = new MutationSummary({
    rootNode: document.getElementById(rootId),
    callback: function(summaries){
      var filtered = [];
      summaries.forEach(function(summary) {
        filtered = filtered.concat(
          summary.added.filter(markerFilter(marker))
        );
      });
      if(filtered.length) callback(filtered);
    },
    queries: [{ characterData: true }]
  });

  return observer;
}

function markerFilter(marker) {
  return function(element) {
    return element.parentNode.id == marker ||
           element.parentNode.classList.contains(marker);
  }
}

// ACTIONS

var baseTitle = document.title;

function setTitle(state) {
  var title = "";
  if(state.actions.known) title += "(" + state.actions.current + ") ";
  if(state.cards.known)   title += "[" + state.cards.current   + "] ";
                          title += baseTitle;
  document.title = title;
}

function notifyBackground(state) {
  message = { 
    command: "notify",
    actions: state.actions,
    cards:   state.cards
  };

  try {
    chrome.runtime.sendMessage(message);
  } catch(e) {
    // Content script orphaned; stop processing
    console.warn("Chandlery " + version + " content script orphaned");
    actionsObserver.disconnect();
    cardsObserver.disconnect();
  }
}

// MESSAGE LISTENER

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch(message.command) {
    case "pingFocus":
      chrome.runtime.sendMessage({command: "focus"});
      break;
  }
});

var version = chrome.runtime.getManifest().version;

console.log("Chandlery " + version + " injected");