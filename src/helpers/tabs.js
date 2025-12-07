/**
 * query() tabs and group/ungroup them based on current state.
 * @returns {Promise<boolean>} Resolves into boolean that tells if this is creating a tab group.
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
