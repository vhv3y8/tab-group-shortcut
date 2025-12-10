import * as chromeRuntime from "../chrome/runtime"
import * as chromeTabGroups from "../chrome/tabGroups"
import { createCommandInput } from "../pages/options/command"
import { ToggleGroupCommand, ToggleGroupPopup } from "./fold/fold"

if (__DEV) log("content script started")

let pageCommand, foldCommandEnabled, focusItemTabAfterUnfold, foldPopup
let fold

// get settings and set variables
chromeRuntime.requestSettings().then((settings) => {
  pageCommand = settings.pageCommand
  foldCommandEnabled = settings.enableFoldCommand
  focusItemTabAfterUnfold = settings.focusItemTabAfterUnfold
  foldPopup = settings.foldPopup
  fold = new ToggleGroupCommand(settings.foldCommand)
})

// 1. group ungroup command

window.addEventListener("keydown", async (e) => {
  if (
    pageCommand &&
    "key" in pageCommand &&
    commandMatches(pageCommand, createCommandInput(e))
  ) {
    e.preventDefault()
    const settingsOpenNamingPopup =
      await chromeRuntime.toggleTabGroupAndGetOpenNamingPopup()
    if (settingsOpenNamingPopup) {
      openNamingPopupAndHandle()
    }

    if (__DEV) log("[settings openNamingPopup]", settingsOpenNamingPopup)
  }
  // if (__DEV) log("[command input]", createCommandInput(e))
})

// message from service worker force command
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "OPEN_NAMING_POPUP") {
    openNamingPopupAndHandle()
    if (__DEV) log("[OPEN_NAMING_POPUP]")
  }
  if (__DEV) log("[force command message]")
})

// group naming popup
function openNamingPopupAndHandle() {
  const groupName = window.prompt("Group name:")
  if (groupName) {
    chromeRuntime.setGroupName(groupName)
  }
}

// 2. fold unfold command

let loadedFoldPopupFiles = false
let isShowingFoldPopup = false
let popup

window.addEventListener("keydown", async (e) => {
  if (foldCommandEnabled) {
    const commandInput = createCommandInput(e)

    // cancel with esc
    if (isShowingFoldPopup && fold.escapePressed(commandInput)) {
      if (__DEV) log("[escape]")
      isShowingFoldPopup = false
      popup.hidePopup()
      return
    }
    // handle command
    if (!loadedFoldPopupFiles) {
      if (fold.allModifierKeyDown(commandInput)) {
        e.preventDefault()
        loadedFoldPopupFiles = true
        if (__DEV) log("loading and attaching popup...")
        const tabgroups = await chromeRuntime.requestCurrentWindowTabGroups()
        if (__DEV) log("[tabgroups]", tabgroups)
        popup = await ToggleGroupPopup.init(
          createFoldPopupShadowHost(),
          tabgroups,
        )
        // apply setting values
        popup.updatePopupPosition(foldPopup.positionNumber)
        if (foldPopup.explicitDarkmode.enable) {
          popup.setExplicitDarkmode(foldPopup.explicitDarkmode.darkmode)
        }
        if (__DEV) log("[popup initialized]", popup)
      }
    } else if (
      fold.allCommandKeyDown(commandInput) &&
      fold.checkPassedThresholdAndSet()
    ) {
      e.preventDefault()
      if (!isShowingFoldPopup) {
        isShowingFoldPopup = true
        // show popup, current group
        popup.showPopup()
        popup.gotoInitialGroup()
        if (__DEV) log("[showing popup]")
      } else {
        // move to next group
        popup.gotoNextGroup()
        if (__DEV) log("[moving to next group]")
      }
    } else if (!isShowingFoldPopup && fold.allModifierKeyDown(commandInput)) {
      if (__DEV) log("fetching tabgroups again...")
      const tabgroups = await chromeRuntime.requestCurrentWindowTabGroups()
      await popup.updateGroupsAndIndexes(tabgroups)
    }
  }
})

window.addEventListener("keyup", async (e) => {
  const commandInput = createCommandInput(e)
  if (isShowingFoldPopup && fold.allKeyUp(commandInput)) {
    // hide popup
    isShowingFoldPopup = false
    popup.hidePopup()
    if (__DEV) log("[hiding popup]")

    // request toggle group
    await chromeRuntime.requestFoldToggleTabgroup(popup.getSelectedTabgroupId())
  }
})

function createFoldPopupShadowHost() {
  if (__DEV) log("[createFoldPopupShadowHost]")
  // create empty shadow host for fold popup and append to body
  const shadowHost = document.createElement("div")
  shadowHost.id = "tabGroupShortcutExtensionFoldPopup"
  shadowHost.style.position = "fixed"
  shadowHost.style.top = "0"
  shadowHost.style.left = "0"
  shadowHost.style.width = "100vw"
  shadowHost.style.height = "100vh"
  // set max z-index, so that its always shown
  shadowHost.style.zIndex = "2147483647"
  shadowHost.style.pointerEvents = "none"
  document.body.appendChild(shadowHost)
  return shadowHost
}

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
