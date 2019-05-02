// ACTIONS

function getActions() {
  // Use CSS selectors to get the actions, as there's not an element with an ID holding it
  var actionsElement = document.querySelector("#accessible-sidebar .player-actions");
  if (!actionsElement) {
    return {known: false};
  }

  // Contains "Actions: 19 of 20". Children contain "Next actions at 8:49", but we don't need that, so we get text of only this
  var actionsText = actionsElement.childNodes[0].nodeValue; 
  var match = actionsText.match(/Actions: (\d+) of (\d+)/);
  if (match) {
    return {
      known: true,
      current: parseInt(match[1]),
      total: parseInt(match[2]),
      full: parseInt(match[1]) == parseInt(match[2])
    };
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
  document.getElementById("accessible-sidebar"),
  "player-actions",
  actionsChange
);

// CARDS

function getCards() {
  var cardsElement = document.querySelector(".deck-info");
  if (!cardsElement) {
    return {known: false};
  }

  // Contains text of the format "X cards waiting!", "1 card remaining!", or "No cards waiting."
  // As well as "Next in 0:01" if applicable
  var cardsText = cardsElement.parentElement.textContent;
  var match = cardsText.match(/(\d+|No) cards? waiting/);
  if (match) {
    return {
      known: true,
      current: (match[1] == "No") ? 0 : parseInt(match[1]),
      full: !cardsText.match(/Next in/)
    };
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
  document.querySelector(".cards deck-container"),
  "deck-info",
  cardsChange
);

// OBSERVER FUNCTIONS

// As far as I can tell, "marker" can be used to specify either an ID or class
// The first arg is a node because sometimes you don't get the option of a nice container with an ID...
function watchForChange(rootNode, marker, callback) { 
  var observer = new MutationSummary({ 
    rootNode: rootNode,
    callback: function(summaries) {
      var filtered = [];
      summaries.forEach(function(summary) {
        filtered = filtered.concat(
          summary.added.filter(markerFilter(marker))
        );
      });
      if (filtered.length) { callback(filtered); }
    },
    queries: [{characterData: true}]
  });

  return observer;
}

function markerFilter(marker) {
  return function(element) {
    return element.parentNode.id == marker ||
           element.parentNode.classList.contains(marker);
  };
}

// ACTIONS

var baseTitle = document.title;

function setTitle(state) {
  var title = "";
  if (state.actions.known) {
    title += "(" + state.actions.current + ") ";
  }
  if (state.cards.known) {
    title += "[" + state.cards.current   + "] ";
  }
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
  } catch (e) {
    // Content script orphaned; stop processing
    console.warn("Chandlery " + version + " content script orphaned");
    actionsObserver.disconnect();
    cardsObserver.disconnect();
  }
}

var version = chrome.runtime.getManifest().version;

console.log("Chandlery " + version + " injected");
