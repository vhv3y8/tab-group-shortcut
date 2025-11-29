import * as chromeStorage from "../../chrome/storage"

// listening command stuff
let isListeningCommand = false
let currentCommandInput = {}

// additional elements
let elems = {
  setPageCommandBtn: undefined,
  listenCommandSection: undefined,
}

// initialize ui
document.addEventListener("DOMContentLoaded", async (e) => {
  const settings = await chromeStorage.getSettings()

  // initialize checkbox ui

  // should be both storage settings property name and options html input checkbox id
  const boolOptions = [
    "enableForceCommand",
    "openNamingPopup",
    "openUpdateNotesPageOnExtensionUpdate",
    "darkmode",
  ]
  const nameToCheckboxMap = new Map()
  for (const optionName of boolOptions) {
    nameToCheckboxMap.set(optionName, document.getElementById(optionName))
  }
  // set checked and listeners
  for (const optionName of boolOptions) {
    const checkbox = nameToCheckboxMap.get(optionName)
    if (settings[optionName]) {
      checkbox.checked = true
    }
    // set checkbox toggle listener
    checkbox.addEventListener("change", async (e) => {
      // get setting every time when switch is clicked
      // so that this doesn't overwrite other values changed elsewhere
      let settings = await chromeStorage.getSettings()
      settings[optionName] = e.target.checked
      await chromeStorage.setSettings(settings)
    })
  }
})

// initialize handlers related to listening page command
document.addEventListener("DOMContentLoaded", async (e) => {
  // initialize listen page command ui

  const setPageCommandBtn = document.getElementById("setPageCommandBtn")
  elems.listenCommandSection = document.getElementById("listenCommand")
  const listenCommandInput = document.getElementById("listenCommandInput")
  const listenCommandMsg = document.getElementById("listenCommandMsg")

  chromeStorage.getSettings().then(({ pageCommand }) => {
    setPageCommandBtn.textContent = keyboardObjToString(pageCommand)
    listenCommandInput.textContent = keyboardObjToString(pageCommand)
    currentCommandInput = pageCommand
  })

  // set toggle command listen mode listeners
  setPageCommandBtn.addEventListener("click", (e) => {
    toggleListenCommandMode()
    // remove focus so that pressing enter key at listening mode is not clicking this button
    e.target.blur()
  })
  elems.listenCommandSection.addEventListener("dblclick", (e) => {
    toggleListenCommandMode()
  })

  // handle command listen
  document.addEventListener("keydown", async (e) => {
    if (isListeningCommand) {
      listenCommandMsg.textContent = ""

      log("[keydown]", e)

      if (e.key === "Escape") {
        toggleListenCommandMode()
      } else if (e.key === "Enter") {
        toggleListenCommandMode()

        // update button text
        setPageCommandBtn.textContent = keyboardObjToString(currentCommandInput)

        // update storage
        const settings = await chromeStorage.getSettings()
        settings.pageCommand = currentCommandInput
        chrome.storage.sync.set({ settings })
      } else if (keyIsCommandable(e.key)) {
        // update current command object
        currentCommandInput = parseToKeyboardObj(e)

        listenCommandInput.textContent =
          keyboardObjToString(currentCommandInput)

        if (__DEV) {
          console.log("[listen] currentCommandInput", currentCommandInput)
          console.log("[listen] e.key", e.key)
        }
      } else {
        listenCommandInput.textContent = ""
        listenCommandMsg.textContent = "Input Command is NOT appropriate."
      }
    }
  })
})

function toggleListenCommandMode() {
  log("[toggle mode] to ", !listenCommand)

  if (isListeningCommand) {
    elems.listenCommandSection.style.display = "none"
  } else {
    elems.listenCommandSection.style.display = "flex"
    chromeStorage.getSettings().then((settings) => {
      listenCommandInput.textContent = keyboardObjToString(settings.pageCommand)
    })
  }

  isListeningCommand = !isListeningCommand
}

/**
 * Binds <input type="checkbox"> switch element to storage setting value.
 * @param {HTMLInputElement} element
 * @param {string} settingName
 */
async function bindInputElemToSettingValue(element, settingName) {
  // set switch value
  let settings = await chromeStorage.getSettings()
  if (settings[settingName]) {
    element.checked = true
  }

  // event listener for switch click
  element.addEventListener("change", async (e) => {
    // get setting every time when switch is clicked
    // so that this doesn't overwrite other values changed elsewhere
    let settings = await chromeStorage.getSettings()
    settings[settingName] = e.target.checked

    await chrome.storage.sync.set({ settings })
  })
}

/**
 * Creates keyboardObj with KeyboardEvent. Change characters to uppercase.
 * @param {KeyboardEvent} keyboardEvent
 * @returns {object}
 */
export function parseToKeyboardObj(keyboardEvent) {
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

/* Options Page */

/**
 * Test if key is commandable. used at options page to listen.
 * @param {string} key
 * @returns {boolean}
 */
export const keyIsCommandable = (key) =>
  key.length === 1 && /^[\S\s]$/.test(key)

const shiftSymbols = new Set([
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "{",
  "}",
  "_",
  "+",
  ":",
  '"',
  "<",
  ">",
  "?",
  "|",
  "~",
])

/**
 * Takes command keyboardObj and gives string representation of it.
 * @param {object} keyboardObj
 * @returns {string}
 */
export function keyboardObjToString(keyboardObj) {
  const commands = []
  const isShiftSymbol = shiftSymbols.has(keyboardObj.key)

  if (keyboardObj.metaKey) commands.push("Meta")
  if (keyboardObj.ctrlKey) commands.push("Ctrl")
  // represent Shift+! as !
  if (keyboardObj.shiftKey && !isShiftSymbol) commands.push("Shift")
  // represent ' ' as Space
  commands.push(keyboardObj.key === " " ? "Space" : keyboardObj.key)

  return commands.join("+")
}

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
