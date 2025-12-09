// export async function requestPageCommand() {
//   return chrome.runtime.sendMessage({
//     action: "GET_PAGE_COMMAND",
//   })
// }

// export async function requestFoldCommandAndEnabled() {
//   return chrome.runtime.sendMessage({
//     action: "GET_FOLD_ENABLED_AND_COMMAND",
//   })
// }

export async function requestSettings() {
  return chrome.runtime.sendMessage({
    action: "GET_SETTINGS",
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

export async function requestFoldPopupUrls() {
  return chrome.runtime.sendMessage({
    action: "GET_FOLD_POPUP_URLS",
  })
}

export async function requestCurrentWindowTabGroups() {
  return chrome.runtime.sendMessage({ action: "GET_CURRENT_TAB_GROUPS" })
}

export async function requestInitialTabGroupId() {
  return chrome.runtime.sendMessage({ action: "GET_INITIAL_GROUP_ID" })
}

export async function requestFoldToggleTabgroup(groupId) {
  return chrome.runtime.sendMessage({
    action: "TOGGLE_FOLD_TAB_GROUP",
    groupId,
  })
}

// service worker

export function getRuntimeFoldPopupUrls() {
  return [
    chrome.runtime.getURL("content-script/fold/foldpopup.html"),
    chrome.runtime.getURL("foldpopup-style.css"),
    chrome.runtime.getURL(""),
  ]
}
