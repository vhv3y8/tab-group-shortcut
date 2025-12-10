import * as chromeTabs from "./tabs"

export async function updateTabGroupName(groupId, groupName) {
  return chrome.tabGroups.update(groupId, {
    title: groupName,
  })
}

export async function queryCurrentWindowTabGroups() {
  return chrome.tabGroups.query({
    windowId: chrome.windows.WINDOW_ID_CURRENT,
  })
}

export async function getCurrentWindowTabGroups() {
  // get current window groups
  let groups = await queryCurrentWindowTabGroups()
  if (__DEV) console.log("[groups before sort]", groups)
  // get current window tabs
  const currentWindowTabs = await chromeTabs.getCurrentWindowTabs()
  if (__DEV) console.log("[currentWindowTabs]", currentWindowTabs)
  // group tabs by groupId
  const groupedByGroupId = Object.groupBy(
    currentWindowTabs,
    ({ groupId }) => groupId,
  )
  if (__DEV) console.log("[groupedByGroupId]", groupedByGroupId)
  // add tabsCount
  for (const [idx, { id }] of Object.entries(groups)) {
    groups[idx].tabsCount = groupedByGroupId[id]?.length || 0
    // for index later
    groups[idx].index = -1
  }
  // add tab titles combined
  let groupIdToTitlesCombined = {}
  Object.keys(groupedByGroupId).forEach((groupId) => {
    groupIdToTitlesCombined[groupId] = ""
  })
  for (const { title, groupId } of currentWindowTabs) {
    if (groupIdToTitlesCombined[groupId] === "") {
      groupIdToTitlesCombined[groupId] = title
      continue
    }
    groupIdToTitlesCombined[groupId] = groupIdToTitlesCombined[groupId].concat(
      ", ",
      title,
    )
  }
  for (let i = 0; i < groups.length; i++)
    groups[i].tabTitlesCombined = groupIdToTitlesCombined[groups[i].id]
  // set groups current window index
  let currentIdx = 0
  let groupIdToIndex = {}
  Object.keys(groupedByGroupId).forEach((groupId) => {
    groupIdToIndex[groupId] = -1
  })
  for (const { groupId } of currentWindowTabs) {
    if (groupIdToIndex[groupId] === -1) {
      groupIdToIndex[groupId] = currentIdx
      currentIdx += 1
    }
  }

  if (__DEV) console.log("[groups after all set]", groups)
  return (
    groups
      // sort by current window appearance order
      .sort((a, b) => groupIdToIndex[a.id] - groupIdToIndex[b.id])
      .map(({ id, color, title, collapsed, tabsCount, tabTitlesCombined }) => ({
        id,
        color,
        title,
        folded: collapsed,
        tabsCount,
        tabTitlesCombined,
      }))
  )
}

export async function getInitialTabGroupId(currentTabId) {
  if (__DEV) console.log("[getInitialTabGroupId: currentTabId]", currentTabId)
  if (!currentTabId) return -1

  const currentWindowTabs = await chrome.tabs.query({ currentWindow: true })
  const currentTabIndex = currentWindowTabs.find(
    ({ id }) => id === currentTabId,
  ).index

  // return group id of current tab if it exists
  const currentTabIsInGroup = currentWindowTabs[currentTabIndex].groupId !== -1
  if (currentTabIsInGroup) {
    if (__DEV) console.log("[returning current group id]")
    return currentWindowTabs[currentTabIndex].groupId
  }

  // return first previous group id relative to current tab
  for (let i = currentTabIndex; 0 <= i; i--) {
    const currentTab = currentWindowTabs[i]
    if (__DEV)
      console.log(
        "[current tab title, group id]",
        currentTab.title,
        currentTab.groupId,
      )
    if (currentTab.groupId !== -1) {
      if (__DEV)
        console.log(
          "[returning previous group id] containing tab title",
          currentTab.title,
        )
      return currentTab.groupId
    }
  }
  // return first group
  if (__DEV)
    console.log(
      "[returning first group id]",
      currentWindowTabs.find(({ groupId }) => groupId !== -1).groupId,
    )
  return currentWindowTabs.find(({ groupId }) => groupId !== -1).groupId
}

export async function foldToggleTabgroup(groupId) {
  const { collapsed: isFolded } = await chrome.tabGroups.get(groupId)
  await chrome.tabGroups.update(groupId, { collapsed: !isFolded })
  return isFolded
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
