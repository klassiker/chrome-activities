'use strict';

(async () => {
  function loadPromise(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (value) => resolve(value[key]));
    });
  }
  function queryPromise(query) {
    return new Promise((resolve) => {
      if (query === undefined) {
        chrome.tabs.query({'currentWindow': true, 'active': false}, (tabs) => {
          queryPromise({'currentWindow': false}).then((value) => {
            resolve(tabs.concat(value));
          });
        });
      } else {
        chrome.tabs.query(query, (tabs) => resolve(tabs));
      }
    });
  }
  async function tabById(id) {
    let found = null;
    let tabs = await queryPromise();

    for (let tab of tabs) {
      if (tab.id == id) {
        found = tab;
      }
    }

    return found;
  }

  function removeAllChilds(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function setActivities(activity, value) {
    if (value === null) {
      delete(activities[activity]);
    } else {
      activities[activity] = value;
    }

    chrome.storage.local.set({"activities": activities}, function() {});
  }
  function setAttributes(node, attrs) {
    for (let attr in attrs) {
      node.setAttribute(attr, attrs[attr]);
    }
  }

  function generateTabList(tabs, button) {
    let frag = document.createDocumentFragment();

    for (let i in tabs) {
      let tab = tabs[i];

      let label = c("label")
      let input = c("input"), icon = c("img")
      let title = c("span"), url = c("span");

      title.appendChild(t(tab.title));
      url.appendChild(t(tab.url));

      if (tab.favIconUrl) {
        setAttributes(icon, {"src": tab.favIconUrl});
      }

      watchList[tab.id] = {"title": title.firstChild, "url": url.firstChild, "icon": icon};

      setAttributes(input, {"type": "checkbox", "name": "tabs", "value": i});
      setAttributes(icon, {"width": "16"});

      if (button) {
        setAttributes(input, {"checked": ""});

        let buttonUp = c("button"), buttonDown = c("button");

        setAttributes(buttonUp, {"type": "button"});
        setAttributes(buttonDown, {"type": "button"});
        buttonUp.appendChild(t("<"));
        buttonDown.appendChild(t(">"));

        buttonUp.addEventListener("click", () => {
          let parent = buttonUp.parentElement;
          let previous = parent.previousElementSibling;

          if (previous && previous.tagName === label.tagName) {
            parent.parentElement.insertBefore(parent, previous);
          }
        });

        buttonDown.addEventListener("click", () => {
          let parent = buttonDown.parentElement;
          let next = parent.nextElementSibling;
          if (next) {
            next = next.nextElementSibling;

            if (next && next.tagName === label.tagName) {
              parent.parentElement.insertBefore(parent, next);
            } else {
              parent.parentElement.appendChild(parent);
            }
          }
        });

        label.append(buttonUp, buttonDown, input);
      } else {
        let tabId = c("span");

        tabId.appendChild(t(tab.id));

        label.append(input, tabId);
      }

      label.append(icon, title, url);
      frag.appendChild(label);
    }

    return frag;
  }
  function generateActivitiesList(activities) {
    let frag = document.createDocumentFragment();

    for (let activity in activities) {
      let tabs = activities[activity];

      let form = c("form");
      let head = c("div");
      let name = c("input"), change = c("button"), remove = c("button");
      let br = c("br"), tabId = c("input"), addTab = c("button");
      let details = c("details"), summary = c("summary");

      setAttributes(name, {"type": "text", "name": "name", "value": activity, "required": ""});
      setAttributes(remove, {"type": "button"});
      setAttributes(tabId, {"type": "number", "placeholder": "Tab-ID"});
      setAttributes(addTab, {"type": "button"});
      setAttributes(head, {"class": "head"});

      change.appendChild(t("Change"));
      remove.appendChild(t("Remove"));
      addTab.appendChild(t("Add tab"));

      head.append(name, change, remove);
      head.append(br, tabId, addTab);

      summary.appendChild(t(activity));

      let regenDetails = () => {
        details.append(summary, head);
        details.appendChild(generateTabList(tabs, true));
      }
      regenDetails();

      form.appendChild(details);
      frag.appendChild(form);

      remove.addEventListener("click", () => {
        setActivities(activity, null);
        form.parentElement.removeChild(form);
      });

      addTab.addEventListener("click", async () => {
        tabs[tabs.length] = await tabById(tabId.value);
        setActivities(activity, tabs);

        removeAllChilds(details);
        regenDetails();
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (form.checkValidity()) {
          let formData = new FormData(form);
          let newName = formData.get("name");
          tabs = formData.getAll("tabs").map(x => tabs[parseInt(x)])

          setActivities(newName, tabs);

          if (newName !== activity) {
            summary.firstChild.textContent = newName;
            setActivities(activity, null);
          }

          removeAllChilds(details);
          regenDetails();
        } else {
          form.reportValidity();
        }
      });
    }

    return frag;
  }

  let $ = (id) => document.getElementById(id);
  let c = (tag) => document.createElement(tag);
  let t = (text) => document.createTextNode(text);
  let openTabsList = await queryPromise();
  let activities = await loadPromise("activities");
  let update = $("update");
  let savedActs = $("savedActs");
  let openTabs = $("openTabs");
  let openTabsHead = openTabs.firstElementChild;

  let watchList = {};
  let reloadFlag = false;
  let setReloadFlag = (state) => {
    return () => {
      reloadFlag = state;
    }
  }
  let reload = async () => {
    watchList = {};
    removeAllChilds(openTabs);
    openTabs.appendChild(openTabsHead);
    openTabs.appendChild(generateTabList(await queryPromise(), false));
  }
  let handler = () => {;
    if (!document.hidden) {
      if (reloadFlag && confirm("Tabs have changed, reload?")) {
        reload();
      }

      reloadFlag = false;
    }
  }

  savedActs.appendChild(generateActivitiesList(activities));
  openTabs.appendChild(generateTabList(openTabsList, false));

  openTabs.addEventListener("submit", (event) => {
    event.preventDefault();

    if (openTabs.checkValidity()) {
      let formData = new FormData(openTabs);
      let actName = formData.get("name");
      let actTabs = formData.getAll("tabs").map(x => openTabsList[x]);
      let replace = true;

      if (activities.hasOwnProperty(actName)) {
        replace = confirm(actName + " already exists, replace?");
      }

      if (actTabs.length == 0) {
        alert("No tab selected!");
        return;
      }

      if (replace) {
        setActivities(actName, actTabs);
        removeAllChilds(savedActs);
        savedActs.appendChild(generateActivitiesList(activities));
      }

      openTabs.reset();
    } else {
      openTabs.reportValidity();
    }
  });
  update.addEventListener("click", reload);

  chrome.tabs.onActivated.addListener(handler);
  chrome.tabs.onCreated.addListener(setReloadFlag(true));
  chrome.tabs.onRemoved.addListener(setReloadFlag(true));
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete" && watchList.hasOwnProperty(tabId)) {
      let nodes = watchList[tabId];
      let icon = tab.favIconUrl;

      if (!icon) {
        icon = "";
      }

      nodes["title"].textContent = tab.title;
      nodes["url"].textContent = tab.url;
      nodes["icon"].src = icon;
    }
  });
})();
