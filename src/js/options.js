$(document).ready(function() {
  $("input[type=radio]").each(function() {
    let el = this;
    chrome.storage.local.get(el.name, function(data) {
      console.log("Load: ", data);
      el.checked = (data[el.name] === el.id);
    });
  }).change(function() {
    let data = {};
    if (this.checked) {
      data[this.name] = this.id;
    }
    console.log("Save: ", data);
    chrome.storage.local.set(data);
  });

  $("input[type=checkbox]").each(function() {
    let el = this;
    chrome.storage.local.get(el.id, function(data) {
      console.log("Load: ", data);
      el.checked = data[el.id];
    });
  }).change(function() {
    let data = {};
    data[this.id] = this.checked;
    console.log("Save: ", data);
    chrome.storage.local.set(data);
  });

  $("input[type=number]").each(function() {
    let el = this;
    chrome.storage.local.get(el.id, function(data) {
      console.log("Load: ", data);
      el.value = data[el.id].toString();
    });
  }).change(function() {
    let data = {};
    data[this.id] = parseInt(this.value);
    console.log("Save: ", data);
    chrome.storage.local.set(data);
  });

  $.ajax("changelog.txt").done(function(text) {
    $("#changelogText").text(text);
  });

  $("#optionsContainer").show();

  $("#changelogLink").click(function() {
    $(".container").not("#changelogContainer").hide();
    $("#changelogContainer").show();
    $("#changelogLink").hide();
    $("#changelogHideLink").show();
  });

  $("#changelogHideLink").click(function() {
    $(".container").not("#optionsContainer").hide();
    $("#optionsContainer").show();
    $("#changelogLink").show();
    $("#changelogHideLink").hide();
  });
});
