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