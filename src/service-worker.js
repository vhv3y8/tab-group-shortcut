import * as chromeStorage from "./chrome/storage"
import * as chromeTabs from "./chrome/tabs"
import * as chromeTabGroups from "./chrome/tabGroups"
import * as chromeRuntime from "./chrome/runtime"

// extension install or update
chrome.runtime.onInstalled.addListener(async (info) => {
  switch (info.reason) {
    case "install": {
      // set initial storage
      await chromeStorage.setStorage(chromeStorage.storageDefault)
      // open tutorial page
      await chromeTabs.openTutorialPage()
      break
    }
    case "update": {
      // do migration, and get result object to do stuff
      const mergedResult = await chromeStorage.doStorageMigration()
      // open update notes page based on setting
      if (mergedResult.settings.openUpdateNotesPageOnExtensionUpdate) {
        await chromeTabs.openUpdateNotesPage()
      }
      break
    }
  }
  if (__DEV) console.log("[tab group shortcut: onInstalled] info", info)
})

// extension icon click
chrome.action.onClicked.addListener(async () => {
  await chromeTabs.openHomePage()
})

// handle messages sent from content script
chrome.runtime.onMessage.addListener((msg, sender, sendBack) => {
  switch (msg.action) {
    case "GET_SETTINGS": {
      // listener have to return true to make other side able to await for sendBack value
      ;(async () => {
        const settings = await chromeStorage.getSettings()
        if (__DEV)
          console.log("[tab group shortcut: GET_SETTINGS: settings]", settings)
        sendBack(settings)
      })()
      return true
    }
    case "TOGGLE_TABGROUP": {
      // listener have to return true to make other side able to await for sendBack value
      ;(async () => {
        // group / ungroup
        const haveCreatedGroup = await chromeTabs.toggleSelectedTabs()
        // send back boolean that it should open naming popup or not
        const settings = await chromeStorage.getSettings()
        sendBack(haveCreatedGroup && settings.openNamingPopup)
      })()
      return true
    }
    case "GET_FOLD_POPUP_URLS": {
      const [htmlUrl, cssUrl] = chromeRuntime.getRuntimeFoldPopupUrls()
      sendBack([htmlUrl, cssUrl])
      return true
    }
    case "GET_CURRENT_TAB_GROUPS": {
      ;(async () => {
        const tabGroups = await chromeTabGroups.getCurrentWindowTabGroups()
        if (__DEV) console.log("[tabGroups]", tabGroups)
        sendBack(tabGroups)
      })()
      return true
    }
    case "SET_TABGROUP_NAME": {
      chromeTabGroups.updateTabGroupName(sender.tab.groupId, msg.groupName)
    }
  }
  if (__DEV) console.log("[tab group shortcut: onMessage] msg", msg)
})

// force toggle command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "FORCE_TOGGLE_GROUP") {
    let settings = await chromeStorage.getSettings()
    // if user set value false, it should not toggle
    if (settings.enableForceCommand) {
      // group / ungroup
      const haveCreatedGroup = await chromeTabs.toggleSelectedTabs()

      // fire open popup message based on setting
      if (haveCreatedGroup && settings.openNamingPopup) {
        const focusedTab = await chromeTabs.queryFocusedTab()
        // send message to showing naming popup at focused tab
        await chromeTabs.fireNamingPopupMsgToTab(focusedTab.id)
      }
    }
  }
  if (__DEV) console.log("[tab group shortcut: onCommand] command", command)
})
