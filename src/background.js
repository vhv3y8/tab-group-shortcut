chrome.runtime.onMessage.addListener((msg, sender, sendRes) => {
  // console.log(sender)
  if (msg === "CREATE_GROUP") {
    chrome.tabs
      .query({ highlighted: true, currentWindow: true })
      .then((tabList) => {
        // console.log(tabList)
        const tabIds = tabList.map((tab) => tab.id)
        const groupIds = tabList.map((tab) => tab.groupId)
        if (groupIds.every((id) => id === -1)) {
          // create new group for every tabs, if every tab has no group.
          chrome.tabs.group({ tabIds: tabList.map((tab) => tab.id) })
        } else if (groupIds.every((id) => id === groupIds[0])) {
          // ungroup, if every tab is in the same group.
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
})
