# Chrome Activity Manager

## Description

This is a simple chrome extension that allows you to manage activities by saving tabs in groups.

It is totally useless since you can achieve the same behaviour with bookmark folders (right-click, `Open all`).

Also it is more difficult to modify the configuration for this extension stored in `google-chrome/${PROFILE_NAME}/Local Extension Settings/${runtime.id}/%06d.log` since it is not pure JSON like the `Bookmarks` file in your profile directory.

This was just a quick fun project. Actually, the local storage should be replaced with the bookmarks api `https://developer.chrome.com/extensions/bookmarks` to allow JSON imports of bookmark data while running or to quickly add some of your open tabs as bookmarks into a folder without the need to open every single tab to create a bookmark for the specific folder. It would still be harder to add a bookmark to an existing folder, but that could be solved by using drag-and-drop or adding another button so the folder is not replaced, but updated.

## Install

Follow the instructions to load this unpacked extension: https://developer.chrome.com/extensions/getstarted#manifest

## Usage

Groups can be deleted, renamed and replaced.

Tabs can be removed from a group and their order can be changed. New tabs can be added by their tab id (second field under `Currently open tabs`).

![](images/options.png)

You can manage your activities by clicking the `Settings` button in the extension popup.

![](images/popup.png)

Saved activities can be started by clicking their button in the popup menu.

Modifiers:
- Shift: open the tabs in a new window
- Control: open the tabs but don't change the focus
