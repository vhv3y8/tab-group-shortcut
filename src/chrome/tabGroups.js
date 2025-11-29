export async function updateTabGroupName(groupId, groupName) {
  return chrome.tabGroups.update(groupId, {
    title: groupName,
  })
}
