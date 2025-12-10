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
// listener have to return true to make other side able to await for sendBack value
chrome.runtime.onMessage.addListener((msg, sender, sendBack) => {
  const senderIsTab = sender.tab && 0 < sender.tab.id
  switch (senderIsTab && msg.action) {
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
        if (__DEV) console.log("[tabGroups sorted]", tabGroups)
        sendBack(tabGroups)
      })()
      return true
    }
    case "GET_INITIAL_GROUP_ID": {
      chromeTabGroups.getInitialTabGroupId(sender.tab.id).then(sendBack)
      return true
    }
    case "SET_TABGROUP_NAME": {
      chromeTabGroups.updateTabGroupName(sender.tab.groupId, msg.groupName)
      break
    }
    case "TOGGLE_FOLD_TAB_GROUP": {
      ;(async () => {
        // toggle fold
        const hasUnfolded = await chromeTabGroups.foldToggleTabgroup(
          msg.groupId,
        )
        if (hasUnfolded) {
          // focus tab in tabgroup, based on option
          const { focusItemTabAfterUnfold } = await chromeStorage.getSettings()
          if (focusItemTabAfterUnfold.enable) {
            const groupTabsSortedByIndex = await chrome.tabs
              .query({ groupId: msg.groupId })
              .then((tabs) => tabs.sort((a, b) => a.index - b.index))
            if (__DEV)
              console.log("[groupTabsSortedByIndex]", groupTabsSortedByIndex)

            const gotoLastTab = focusItemTabAfterUnfold.firstOrLastGotoLast
            if (gotoLastTab) {
              const lastTabId =
                groupTabsSortedByIndex[groupTabsSortedByIndex.length - 1].id
              chrome.tabs.update(lastTabId, { active: true })
            } else {
              const firstTabId = groupTabsSortedByIndex[0].id
              chrome.tabs.update(firstTabId, { active: true })
            }
          }
        } else {
          // move to next tab. tab focus lives even when tabgroup containing it is folded.
          // chrome browser behavior seems like:
          // move to next tab after folded tabgroup, or previous tab before tabgroup (if there is none after).
          // and if all tabs are in tabgroup and no tab is active after fold (e.g. all tabs are in single group, or there are other groups but they are all folded), create new tab and focus.
          const currentWindowTabs = await chromeTabs.getCurrentWindowTabs()
          if (__DEV)
            console.log("[after fold] currentWindowTabs", currentWindowTabs)
          const { index: focusedTabIndex } = currentWindowTabs.find(
            ({ active }) => active,
          )
          if (__DEV)
            console.log("[after fold] focusedTabIndex", focusedTabIndex)
          const groupIdToCollapsed = { "-1": false }
          const currentWindowGroups =
            await chromeTabGroups.queryCurrentWindowTabGroups()
          if (__DEV)
            console.log("[after fold] currentWindowGroups", currentWindowGroups)
          for (const { id, collapsed } of currentWindowGroups)
            groupIdToCollapsed[id] = collapsed
          if (__DEV)
            console.log("[after fold] groupIdToCollapsed", groupIdToCollapsed)
          // check next tabs and focus if its possible
          let foundNextTab = false
          for (let i = focusedTabIndex; i < currentWindowTabs.length; i++) {
            if (__DEV)
              console.log("[after fold] next", currentWindowTabs[i].title)
            const currentTabGroupId = currentWindowTabs[i].groupId
            if (__DEV)
              console.log("[after fold] currentTabGroupId", currentTabGroupId)
            if (groupIdToCollapsed[currentTabGroupId.toString()]) continue

            if (__DEV)
              console.log("[after fold] found", currentWindowTabs[i].id)
            foundNextTab = true
            chrome.tabs.update(currentWindowTabs[i].id, { active: true })
            break
          }
          if (!foundNextTab) {
            // check previous tabs and focus if its possible
            let foundPreviousTab = false
            for (let i = focusedTabIndex - 1; 0 <= i; i--) {
              if (__DEV)
                console.log("[after fold] previous", currentWindowTabs[i].title)
              const currentTabGroupId = currentWindowTabs[i].groupId
              if (__DEV)
                console.log("[after fold] currentTabGroupId", currentTabGroupId)
              if (groupIdToCollapsed[currentTabGroupId.toString()]) continue

              if (__DEV)
                console.log("[after fold] found", currentWindowTabs[i].id)
              foundPreviousTab = true
              chrome.tabs.update(currentWindowTabs[i].id, { active: true })
              return
            }

            if (!foundPreviousTab) {
              // create new tab and focus
              chrome.tabs.create({ active: true })
            }
          }
        }
      })()
      break
    }
    default: {
      break
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
