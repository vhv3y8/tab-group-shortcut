import { getSettings } from "../helpers/storage"
import {
  keyIsCommandable,
  parseToKeyboardObj,
  keyboardObjToString,
} from "../helpers/command"

// name should be both 1. storage settings property name, 2. element id
const switchSettingNames = ["enableForceCommand", "showNamingPopup"]
for (const name of switchSettingNames) {
  bindInputElemToSettingValue(document.getElementById(name), name)
}

let listenCommand = false
const setPageCommandBtn = document.getElementById("setPageCommandBtn")
const listenCommandSection = document.getElementById("listenCommand")
const listenCommandInput = document.getElementById("listenCommandInput")
const listenCommandMsg = document.getElementById("listenCommandMsg")

let settings
let currentCommandInput = {}
getSettings().then(({ pageCommand }) => {
  setPageCommandBtn.textContent = keyboardObjToString(pageCommand)
  listenCommandInput.textContent = keyboardObjToString(pageCommand)
  currentCommandInput = pageCommand
})

setPageCommandBtn.addEventListener("click", (e) => {
  toggleListenCommandMode()

  // remove focus so that pressing enter key at listening mode is not clicking this button
  e.target.blur()
})
listenCommandSection.addEventListener("dblclick", (e) => {
  toggleListenCommandMode()
})

document.addEventListener("keydown", async (e) => {
  if (listenCommand) {
    listenCommandMsg.textContent = ""

    if (import.meta.env.MODE === "development") console.log("[keydown]", e)

    if (e.key === "Escape") {
      toggleListenCommandMode()
    } else if (e.key === "Enter") {
      toggleListenCommandMode()

      // update button text
      setPageCommandBtn.textContent = keyboardObjToString(currentCommandInput)

      // update storage
      const settings = await getSettings()
      settings.pageCommand = currentCommandInput
      chrome.storage.sync.set({ settings })
    } else if (keyIsCommandable(e.key)) {
      // update current command object
      currentCommandInput = parseToKeyboardObj(e)

      listenCommandInput.textContent = keyboardObjToString(currentCommandInput)

      if (import.meta.env.MODE === "development") {
        console.log("[listen] currentCommandInput", currentCommandInput)
        console.log("[listen] e.key", e.key)
      }
    } else {
      listenCommandInput.textContent = ""
      listenCommandMsg.textContent = "Input Command is NOT appropriate."
    }
  }
})

function toggleListenCommandMode() {
  if (import.meta.env.MODE === "development")
    console.log("[toggle mode] to ", !listenCommand)

  if (listenCommand) {
    listenCommandSection.style.display = "none"
  } else {
    listenCommandSection.style.display = "flex"
    getSettings().then((settings) => {
      listenCommandInput.textContent = keyboardObjToString(settings.pageCommand)
    })
  }

  listenCommand = !listenCommand
}

/**
 * Binds <input type="checkbox"> switch element to storage setting value.
 * @param {HTMLInputElement} element
 * @param {string} settingName
 */
async function bindInputElemToSettingValue(element, settingName) {
  // set switch value
  let settings = await getSettings()
  if (settings[settingName]) {
    element.checked = true
  }

  // event listener for switch click
  element.addEventListener("change", async (e) => {
    // get setting every time when switch is clicked
    // so that this doesn't overwrite other values changed elsewhere
    let settings = await getSettings()
    settings[settingName] = e.target.checked

    await chrome.storage.sync.set({ settings })
  })
}
