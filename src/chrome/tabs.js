// Open Page

export async function openTutorialPage() {
  return chrome.tabs.create({
    url: chrome.runtime.getURL("pages/tutorial/index.html"),
  })
}

export async function openUpdateNotesPage() {
  return chrome.tabs.create({
    url: chrome.runtime.getURL("pages/update_notes/index.html"),
  })
}

export async function openHomePage() {
  return chrome.tabs.create({
    url: chrome.runtime.getURL("pages/home/index.html"),
  })
}

// Query

export async function queryFocusedTab() {
  return chrome.tabs
    .query({ active: true, currentWindow: true })
    .then((tabs) => tabs[0])
}

export async function getCurrentWindowTabs() {
  return chrome.tabs.query({ currentWindow: true })
}

/**
 * query selected tabs and group/ungroup them based on current state.
 * @returns {Promise<boolean>} Resolves into boolean that tells if this created a tab group.
 */
export async function toggleSelectedTabs() {
  return chrome.tabs
    .query({ highlighted: true, currentWindow: true })
    .then((tabList) => {
      const tabIds = tabList.map((tab) => tab.id)
      const groupIds = tabList.map((tab) => tab.groupId)

      if (groupIds.every((id) => id === -1)) {
        chrome.tabs.group({
          tabIds: tabList.map((tab) => tab.id),
        })
        return true
      } else if (groupIds.every((id) => id === groupIds[0])) {
        chrome.tabs.ungroup(tabIds)
        return false
      } else {
        // find the first tab that has group, and add every other tabs to that group.
        for (const id of groupIds) {
          if (id !== -1) {
            chrome.tabs.group({
              groupId: id,
              tabIds,
            })
          }
        }
        return false
      }
    })
}

// Message

export async function fireNamingPopupMsgToTab(tabId) {
  return chrome.tabs.sendMessage(tabId, {
    action: "OPEN_NAMING_POPUP",
  })
}
