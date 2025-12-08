export async function updateTabGroupName(groupId, groupName) {
  return chrome.tabGroups.update(groupId, {
    title: groupName,
  })
}

export async function getCurrentWindowTabGroups() {
  let groups = await chrome.tabGroups.query({
    windowId: chrome.windows.WINDOW_ID_CURRENT,
  })
  const currentWindowTabs = await chrome.tabs.query({ currentWindow: true })
  const groupedByGroupId = currentWindowTabs.groupBy(({ groupId }) => groupId)
  for (const [idx, { groupId }] of Object.entries(groups)) {
    groups[idx].tabsCount = groupedByGroupId[groupId]?.length || 0
  }
  return groups
}

export async function getInitialTabGroupId() {
  const currentTabId = await chrome.tabs.getCurrent().then(({ id }) => id)
  if (__DEV) console.log("[currentTabId]", currentTabId)
  if (!currentTabId) return -1

  const currentWindowTabs = await chrome.tabs.query({ currentWindow: true })
  const currentTabIdx = currentWindowTabs.find(
    ({ id }) => id === currentTabId,
  )?.id
  if (!currentTabIdx) return -1
  const reorderedGroupIds = rotate(currentWindowTabs, currentTabIdx).map(
    ({ groupId }) => ({ groupId }),
  )
  return reorderedGroupIds.find(({ groupId }) => groupId !== -1) || -1
}

// utils

function reverse(a, s, e) {
  while (s < e) (([a[s], a[e]] = [a[e], a[s]]), s++, e--)
}

function rotate(a, k) {
  k %= a.length
  reverse(a, 0, k - 1)
  reverse(a, k, a.length - 1)
  reverse(a, 0, a.length - 1)
  return a
}
