/* global MutationSummary */

// ACTIONS

// General design:
// getActions() polls a known element for data.
// actionsRootObserver watches for appearance of the DOM fragment containing the element.
// actionsObservable(el) starts watching the (smallest possible) DOM fragment for action data.
// actionsChange() is called every time the data changes or becomes newly available in the DOM.

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

let actionsObserver;

let actionsRootObserver = watchForObservable(
  document.querySelector("#root"),
  ".player-actions",
  actionsObservable
);

function actionsObservable(element) {
  if (actionsObserver) {
    actionsObserver.disconnect();
  }
  actionsObserver = watchForChange(
    element,
    "player-actions",
    actionsChange
  );
  actionsChange();
}

function actionsChange() {
  const state = {actions: getActions(), cards: getCards()};
  setTitle(state);
  notifyBackground(state);
}

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

let cardsObserver;

let cardsRootObserver = watchForObservable(
  document.querySelector("#root"),
  ".deck-info__cards-in-deck",
  cardsObservable
);

function cardsObservable(element) {
  if (cardsObserver) {
    cardsObserver.disconnect();
  }
  cardsObserver = watchForChange(
    element,
    "deck-info__cards-in-deck",
    cardsChange
  );
  cardsChange();
}

function cardsChange() {
  const state = {actions: getActions(), cards: getCards()};
  setTitle(state);
  notifyBackground(state);
}

// OBSERVER FUNCTIONS

// Creates an observer looking for DOM subtree root defined by targetQuery under rootNode.
// If matching nodes are inserted into the DOM, call callback on each.
function watchForObservable(rootNode, targetQuery, callback) {
  const observer = new MutationSummary({
    rootNode: rootNode,
    callback: function(summaries) {
      summaries.forEach(function(summary) {
        summary.added.forEach((element) => callback(element));
      });
    },
    queries: [{element: targetQuery}]
  });

  return observer;
}

// Creates an observer for character data change in DOM subtree from rootNode.
// If the change occurred in a (text) node whose parent matches the marker, call callback.
function watchForChange(rootNode, marker, callback) {
  if (rootNode === null) {
    return undefined;
  }

  function markerFilter(marker) {
    return function(element) {
      return element.parentNode.id == marker ||
             element.parentNode.classList.contains(marker);
    };
  }

  const observer = new MutationSummary({
    rootNode: rootNode,
    callback: function(summaries) {
      let filtered = [];
      summaries.forEach(function(summary) {
        filtered.push(...summary.added.filter(markerFilter(marker)));
        filtered.push(...summary.valueChanged.filter(markerFilter(marker)));
      });
      if (filtered.length) { callback(); }
    },
    queries: [{characterData: true}]
  });

  return observer;
}

// TITLE UPDATES

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
    const observers = [actionsObserver, actionsRootObserver, cardsObserver, cardsRootObserver];

    console.warn("Chandlery " + version + " content script orphaned");
    observers.forEach((observer) => {
      if (observer) {
        observer.disconnect();
      }
    });
  }
}

// INITIALIZATION

const version = chrome.runtime.getManifest().version;

console.log("Chandlery " + version + " injected");

// In case that elements exist at the start (script was reloaded)
actionsObserver = watchForChange(
  document.querySelector(".player-actions"),
  "player-actions",
  actionsChange
);
cardsObserver = watchForChange(
  document.querySelector(".deck-info__cards-in-deck"),
  "deck-info__cards-in-deck",
  cardsChange
);
