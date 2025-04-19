import {
  storageInitial,
  storagePropertyChangeMaps,
  mergeDeep,
  renameProperty,
  getSettings,
} from "./helpers/storage"
import { toggleSelectedTabs } from "./helpers/tabs"

/**
 * When extension is installed or updated.
 */
chrome.runtime.onInstalled.addListener((info) => {
  switch (info.reason) {
    // Extension Install
    case "install": {
      // set initial setting data
      chrome.storage.sync.set(storageInitial)

      // open tutorial page
      chrome.tabs.create({
        url: chrome.runtime.getURL("description/index.html"),
      })
      break
    }
    // Extension Update
    case "update": {
      // Update the storage
      chrome.storage.sync.get(null, (currentData) => {
        // update changed property names to current data
        storagePropertyChangeMaps.forEach(({ oldPath, newPath, transform }) => {
          renameProperty(currentData, oldPath, newPath, transform)
        })

        // deep merge added properties
        // overwrites current data over default values
        const merged = mergeDeep(storageInitial, currentData)
        chrome.storage.sync.set(merged)

        if (import.meta.env.MODE === "development") {
          console.log("[update] storageInitial", storageInitial)
          console.log("[update] currentData", currentData)
          console.log("[update] merged", merged)
        }
      })

      // open home page for update notes
      chrome.tabs.create({
        url: chrome.runtime.getURL("home/index.html"),
      })
      break
    }
  }
})

/**
 * When extension icon is clicked.
 */
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("home/index.html"),
  })
})

/**
 * Performs action given from content script.
 */
chrome.runtime.onMessage.addListener((msg, sender, sendRes) => {
  if (import.meta.env.MODE === "development")
    console.log("[onMessage] msg", msg)

  switch (msg.action) {
    case "PAGE_COMMAND": {
      getSettings().then((settings) => {
        if (import.meta.env.MODE === "development")
          console.log(
            "[onMessage] [PAGE_COMMAND] settings.pageCommand",
            settings.pageCommand,
          )

        sendRes(settings.pageCommand)
      })
      return true
    }
    case "TOGGLE_GROUP": {
      if (import.meta.env.MODE === "development")
        console.log("[onMessage] [TOGGLE_GROUP]")

      // group / ungroup
      toggleSelectedTabs().then((isCreatingGroup) => {
        // get settings to check showNamingPopup value
        getSettings().then((settings) => {
          if (import.meta.env.MODE === "development") {
            console.log("[onMessage] [TOGGLE_GROUP] settings", settings)
            console.log(
              "[onMessage] [TOGGLE_GROUP] isCreatingGroup",
              isCreatingGroup,
            )
          }

          // send back boolean about showing naming popup prompt or not
          sendRes(settings.showNamingPopup && isCreatingGroup)
        })
      })
      return true
    }
    case "SET_GROUP_NAME": {
      if (import.meta.env.MODE === "development") {
        console.log(
          "[onMessage] [SET_GROUP_NAME] sender.tab.groupId",
          sender.tab.groupId,
        )
      }

      if (sender.tab.groupId !== -1) {
        chrome.tabGroups.update(sender.tab.groupId, {
          title: msg.groupName,
        })
      }
      return true
    }
    default: {
      return true
    }
  }
})

/**
 * When predefined command is pressed.
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "FORCE_TOGGLE_GROUP") {
    // check setting every time when command is matched
    let { enableForceCommand, showNamingPopup } = await getSettings().then(
      (settings) => ({
        enableForceCommand: settings.enableForceCommand,
        showNamingPopup: settings.showNamingPopup,
      }),
    )

    if (enableForceCommand) {
      // do force group / ungroup
      const isCreatingGroup = await toggleSelectedTabs()

      if (import.meta.env.MODE === "development")
        console.log("[onCommand] [FORCE] isCreatingGroup", isCreatingGroup)

      if (showNamingPopup && isCreatingGroup) {
        const focusedTab = await chrome.tabs
          .query({ active: true, currentWindow: true })
          .then((tabs) => tabs[0])

        if (import.meta.env.MODE === "development")
          console.log("[onCommand] [FORCE] focusedTab", focusedTab)

        // send message about showing naming popup to focused tab
        chrome.tabs
          .sendMessage(focusedTab.id, {
            action: "SHOW_NAME_POPUP",
          })
          .catch(() => {
            // cannot establish connection
            console.log(
              "[onCommand] [FORCE]  content script is restricted for this page. cannot show popup: ",
              focusedTab.url,
            )
          })
      }
    }
  }
})
