// open description page when installed
chrome.runtime.onInstalled.addListener((info) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("description/index.html"),
  })

  chrome.storage.sync.set({
    settings: {
      turnOffForceCommand: false,
    },
  })
})

// open description page at icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("description/index.html"),
  })
})

// force toggle tab group
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "FORCE_TOGGLE_GROUP") {
    // check setting every time when command is matched
    let turnOffForceCommand = await getSettings().then(
      (setting) => setting.turnOffForceCommand,
    )

    if (!turnOffForceCommand) {
      console.log("FORCE")
      toggleSelectedTabs()
    }
  }
})

// toggle tab group
chrome.runtime.onMessage.addListener((msg, sender, sendRes) => {
  if (msg === "TOGGLE_GROUP") {
    console.log("TOGGLE")
    toggleSelectedTabs()
  }
})

function toggleSelectedTabs() {
  chrome.tabs
    .query({ highlighted: true, currentWindow: true })
    .then((tabList) => {
      const tabIds = tabList.map((tab) => tab.id)
      const groupIds = tabList.map((tab) => tab.groupId)

      if (groupIds.every((id) => id === -1)) {
        chrome.tabs.group({ tabIds: tabList.map((tab) => tab.id) })
      } else if (groupIds.every((id) => id === groupIds[0])) {
        chrome.tabs.ungroup(tabIds)
      } else {
        // find the first tab that has group, and add every other tabs to that group.
        for (const id of groupIds) {
          if (id !== -1) {
            chrome.tabs.group({
              groupId: id,
              tabIds,
            })
            break
          }
        }
      }
    })
}

async function getSettings() {
  return chrome.storage.sync.get(["settings"]).then((db) => {
    return db.settings
  })
}
