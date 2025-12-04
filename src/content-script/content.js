import * as chromeRuntime from "../chrome/runtime"
import { attachAndCreateFoldPopup } from "./fold/fold"

if (__DEV) log("content script started")

let pageCommand

window.addEventListener("load", () => {
  // get page command from storage and set variable
  chromeRuntime.getPageCommand().then((settingPageCommand) => {
    if (__DEV) log("page command fetched", settingPageCommand)
    pageCommand = settingPageCommand
  })
})

document.addEventListener("DOMContentLoaded", () => {
  const container = document.createElement("div")
  document.body.appendChild(container)
  attachAndCreateFoldPopup(container)
})

function openNamingPopupAndHandle() {
  const groupName = window.prompt("Group name:")
  if (groupName) {
    chromeRuntime.setGroupName(groupName)
  }
}

// keyboard shortcut
window.addEventListener("keydown", async (e) => {
  if (__DEV) log("parseToKeyboardObj(e)", parseToKeyboardObj(e))

  if (
    !!pageCommand &&
    "key" in pageCommand &&
    commandMatches(pageCommand, parseToKeyboardObj(e))
  ) {
    e.preventDefault()
    const settingsOpenNamingPopup =
      await chromeRuntime.toggleTabGroupAndGetOpenNamingPopup()
    if (__DEV) log(settingsOpenNamingPopup)

    if (settingsOpenNamingPopup) {
      openNamingPopupAndHandle()
    }

    if (__DEV)
      if (__DEV)
        log("Page Command pressed.", pageCommand, settingsOpenNamingPopup)
  }
})

// message from service worker force command
chrome.runtime.onMessage.addListener((msg) => {
  if (__DEV) log("force command message")
  if (msg.action === "OPEN_NAMING_POPUP") {
    openNamingPopupAndHandle()
    if (__DEV) log("OPEN_NAMING_POPUP")
  }
})

// Utils

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
 * Creates keyboardObj from KeyboardEvent. Change characters to uppercase.
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

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
