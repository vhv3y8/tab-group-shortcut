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
  if (__DEV) console.log("[currentWindowTabs]", currentWindowTabs)
  const groupedByGroupId = Object.groupBy(
    currentWindowTabs,
    ({ groupId }) => groupId,
  )
  if (__DEV) console.log("[groupedByGroupId]", groupedByGroupId)
  // add tabsCount
  for (const [idx, { id }] of Object.entries(groups)) {
    groups[idx].tabsCount = groupedByGroupId[id]?.length || 0
  }
  // add tab titles
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

  if (__DEV) console.log("[groups after all set]", groups)
  return groups.map(
    ({ id, color, title, collapsed, tabsCount, tabTitlesCombined }) => ({
      id,
      color,
      title,
      folded: collapsed,
      tabsCount,
      tabTitlesCombined,
    }),
  )
}

export async function getInitialTabGroupId(currentTabId) {
  // const currentTabId = await chrome.tabs
  //   .query({ currentWindow: true, active: true })
  //   .then(({ id }) => id)
  if (__DEV) console.log("[getInitialTabGroupId: currentTabId]", currentTabId)
  if (!currentTabId) return -1

  const currentWindowTabs = await chrome.tabs.query({ currentWindow: true })
  const currentTabIdx = currentWindowTabs
    .map(({ id }) => id)
    .indexOf(currentTabId)
  if (!currentTabIdx) return -1
  if (__DEV) console.log("[getInitialTabGroupId: currentTabIdx]", currentTabIdx)

  if (__DEV)
    console.log(
      "[getInitialTabGroupId: groupIds]",
      currentWindowTabs.map(({ groupId }) => groupId),
    )
  const reorderedGroupIds = rotate(
    currentWindowTabs,
    (currentTabIdx + currentWindowTabs.length) % currentWindowTabs.length,
  ).map(({ groupId }) => groupId)
  if (__DEV)
    console.log("[getInitialTabGroupId: reorderedGroupIds]", reorderedGroupIds)
  const initialTabGroupId = reorderedGroupIds.find(({ id }) => id !== -1)
  if (__DEV)
    console.log("[getInitialTabGroupId: initialTabGroupId]", initialTabGroupId)
  return initialTabGroupId || -1
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
