export async function getPageCommand() {
  return chrome.runtime.sendMessage({
    action: "GET_PAGE_COMMAND",
  })
}

export async function toggleTabGroupAndGetOpenNamingPopup() {
  return chrome.runtime.sendMessage({
    action: "TOGGLE_TABGROUP",
  })
}

export async function setGroupName(groupName) {
  return chrome.runtime.sendMessage({
    action: "SET_TABGROUP_NAME",
    groupName,
  })
}
