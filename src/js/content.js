/* global MutationSummary */
// ACTIONS

function getActions() {
  // Use CSS selectors to get the actions, as there's not an element with an ID holding it
  const actionsElement = document.querySelector("#accessible-sidebar .player-actions");
  if (!actionsElement) {
    return {known: false};
  }

  // Contains "Actions: 19 of 20". Children contain "Next actions at 8:49", but we don't need that, so we get text of only this
  const actionsText = actionsElement.childNodes[0].nodeValue;
  const match = actionsText.match(/Actions: (\d+) of (\d+)/);
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
  const state = {actions: getActions(), cards: getCards()};
  setTitle(state);
  notifyBackground(state);
}

let actionsObserver = watchForChange(
  document.getElementById("#root"),
  "player-actions",
  actionsChange
);

// CARDS

function getCards() {
  const cardsElement = document.querySelector(".deck-info");
  if (!cardsElement) {
    return {known: false};
  }

  // Contains text of the format "X cards waiting!", "1 card remaining!", or "No cards waiting."
  // As well as "Next in 0:01" if applicable
  const cardsText = cardsElement.parentElement.textContent;
  const match = cardsText.match(/(\d+|No) cards? waiting/);
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
  const state = {actions: getActions(), cards: getCards()};
  setTitle(state);
  notifyBackground(state);
}

let cardsObserver = watchForChange(
  document.querySelector("#root"),
  "deck-info__cards-in-deck",
  cardsChange
);

// OBSERVER FUNCTIONS

// As far as I can tell, "marker" can be used to specify either an ID or class
// The first arg is a node because sometimes you don't get the option of a nice container with an ID...
function watchForChange(rootNode, marker, callback) {
  const observer = new MutationSummary({
    rootNode: rootNode,
    callback: function(summaries) {
      let filtered = [];
      summaries.forEach(function(summary) {
        filtered = filtered.concat(
          summary.added.filter(markerFilter(marker))
        );
        filtered = filtered.concat(
          // Big performance hit with #root?
          summary.valueChanged.filter(markerFilter(marker))
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

const baseTitle = document.title;

function setTitle(state) {
  let title = "";
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
  const message = {
    command: "notify",
    actions: state.actions,
    cards: state.cards
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

const version = chrome.runtime.getManifest().version;

console.log("Chandlery " + version + " injected");
