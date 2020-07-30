'use strict';

(async () => {
  function loadPromise(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (value) => resolve(value[key]));
    });
  }
  function openOptions() {
    chrome.tabs.create({ 'url': 'chrome-extension://' + chrome.runtime.id + "/options.html"});
  }

  let $ = (id) => document.getElementById(id);
  let c = (tag) => document.createElement(tag);
  let t = (text) => document.createTextNode(text);
  let activities = await loadPromise('activities');
  let buttons = $('buttons');

  $('config').addEventListener("click", openOptions);

  for (let activity in activities) {
    let tabs = activities[activity];
    let button = c("button");

    button.appendChild(t(activity));
    buttons.appendChild(button);

    button.addEventListener("click", (event) => {
      let urls = tabs.map(x => x.url);

      if (event.shiftKey) {
        chrome.windows.create({"url": urls}, function() {});
      } else {
        let active = !event.ctrlKey;

        for (let url of urls) {
          chrome.tabs.create({"url": url, "active": active});
        }
      }
    });
  }
})();
