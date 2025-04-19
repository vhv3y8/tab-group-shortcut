let pageCommand
// get page command object from storage
chrome.runtime
  .sendMessage({
    action: "PAGE_COMMAND",
  })
  .then((settingPageCommand) => {
    pageCommand = settingPageCommand

    if (import.meta.env.MODE === "development")
      console.log("[PAGE_COMMAND] settingPageCommand", settingPageCommand)
  })

window.addEventListener("keydown", async (e) => {
  console.log("parseToKeyboardObj(e)", parseToKeyboardObj(e))

  if (
    !!pageCommand &&
    "key" in pageCommand &&
    commandMatches(pageCommand, parseToKeyboardObj(e))
  ) {
    e.preventDefault()
    if (import.meta.env.MODE === "development")
      console.log(
        "Page Command pressed. (Tab Group Shortcut Extension)",
        pageCommand,
      )

    const showNamingPopup = await chrome.runtime.sendMessage({
      action: "TOGGLE_GROUP",
    })
    if (showNamingPopup) {
      promptAndSetGroupName()
    }

    if (import.meta.env.MODE === "development")
      console.log("[TOGGLE_GROUP response] showNamingPopup", showNamingPopup)
  }
})

// Show name popup on Force Command (Ctrl+Q)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "SHOW_NAME_POPUP") {
    if (import.meta.env.MODE === "development") console.log("[SHOW_NAME_POPUP]")

    promptAndSetGroupName()
  }
})

function promptAndSetGroupName() {
  const groupName = window.prompt("Group name:")
  if (groupName) {
    chrome.runtime.sendMessage({
      action: "SET_GROUP_NAME",
      groupName,
    })
  }
}

// Cannot find how to make self contained bundles for multiple inputs in vite.
// shared module file is always created and imports remain.
// so cannot use helper files here.

/**
 * Used at content script to match storage command setting with keyboard object.
 * @param {object} commandSetting
 * @param {object} keyboardObj
 * @returns {boolean}
 */
export function commandMatches(commandSetting, keyboardObj) {
  if (commandSetting.metaKey !== keyboardObj.metaKey) return false
  if (commandSetting.ctrlKey !== keyboardObj.ctrlKey) return false
  if (commandSetting.shiftKey !== keyboardObj.shiftKey) return false
  if (commandSetting.key !== keyboardObj.key) return false
  return true
}

/**
 * Creates keyboardObj with KeyboardEvent. Change characters to uppercase.
 * @param {KeyboardEvent} keyboardEvent
 * @returns {object}
 */
function parseToKeyboardObj(keyboardEvent) {
  const keyboardObj = {
    metaKey: keyboardEvent.metaKey,
    ctrlKey: keyboardEvent.ctrlKey,
    shiftKey: keyboardEvent.shiftKey,
  }

  const key = keyboardEvent.key
  if (key.length === 1 && "a" <= key && key <= "z")
    keyboardObj.key = key.toUpperCase()
  else keyboardObj.key = key

  return keyboardObj
}
