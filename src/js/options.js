$(document).ready(function() {
  $("input[type=checkbox]").each(function() {
    var el = this;
    chrome.storage.local.get(el.id, function(data) {
      console.log("Load: ", data);
      el.checked = data[el.id];
    });
  }).change(function() {
    var data = {};
    data[this.id] = this.checked;
    console.log("Save: ", data);
    chrome.storage.local.set(data);
  });

  $.ajax("changelog.txt").done(function(text) {
    $("#changelogText").text(text);
  });

  $("#changelogLink, #changelogHideLink").click(function() {
    $("#optionsContainer, #changelogContainer").toggle();
    $("#changelogLink, #changelogHideLink").toggle();
  });
});
