import * as chromeStorage from "../../chrome/storage"
import {
  isAppropriateCommandInput,
  createCommandInput,
  createCommandRepresenterFor,
  userIsMac,
} from "./command"

const CMD_OPT_NAME = {
  PAGE: "pageCommand",
  FOLD: "foldCommand",
}

// states for listening command
let isListeningCommand = false
let currentCommandInput = {}
let currentListenOptionName = CMD_OPT_NAME.PAGE

// common elements to handle
let elems = {
  listenCommandSection: undefined,
  foldPopupPreviewSection: undefined,
}

// initialize variables and ui with settings value
document.addEventListener("DOMContentLoaded", async (e) => {
  const settings = await chromeStorage.getSettings()
  const pageCommand = settings.pageCommand
  const foldCommand = settings.foldCommand

  // initialize variables
  currentCommandInput = pageCommand

  // 1. initialize checkbox ui
  const boolOptions = [
    "openNamingPopup",
    "enableForceCommand",
    "enableFoldCommand",
    "openUpdateNotesPageOnExtensionUpdate",
  ]
  const nameToCheckboxElemMap = new Map()
  for (const option of boolOptions) {
    // should be both storage settings property name, and options html input checkbox id
    const id = option
    nameToCheckboxElemMap.set(option, document.getElementById(id))
  }
  // set initial checked value and set handlers
  for (const option of boolOptions) {
    const checkbox = nameToCheckboxElemMap.get(option)
    // set checked value
    if (settings[option]) {
      checkbox.checked = true
    }
    // set checkbox toggle handler
    checkbox.addEventListener("change", async (e) => {
      let settings = await chromeStorage.getSettings()
      settings[option] = e.target.checked
      await chromeStorage.setSettings(settings)
    })
  }

  //
  document
    .getElementById("enableFoldCommand")
    .addEventListener("change", (e) => {
      if (!e.target.checked) {
        // TODO
      }
    })

  // 2. initialize non-checkbox ui

  // 1) command stuff
  const isMac = userIsMac()

  // set group / ungroup command
  const setPageCommandBtn = document.getElementById("setPageCommandBtn")
  // show initial group / ungroup command value
  createCommandRepresenterFor({ container: setPageCommandBtn, isMac })(
    pageCommand,
  )
  // set click handler
  setPageCommandBtn.addEventListener("click", () => {
    currentListenOptionName = CMD_OPT_NAME.PAGE
    toggleListenCommandPopup()
  })

  // set fold / unfold command
  const setPageFoldCommandBtn = document.getElementById("setPageFoldCommandBtn")
  // show initial fold / unfold command value
  createCommandRepresenterFor({ container: setPageFoldCommandBtn, isMac })(
    foldCommand,
  )
  // set click handler
  setPageFoldCommandBtn.addEventListener("click", () => {
    currentListenOptionName = CMD_OPT_NAME.FOLD
    toggleListenCommandPopup()
  })

  // 2) other stuff

  // fold popup position

  // fold popup font size
  const foldPopupFontSizeInput = document.getElementById("foldPopupFontSize")
  foldPopupFontSizeInput.value = settings.foldPopup.fontSizePx

  // fold popup darkmode

  // explicit darkmode on extension pages
})

// initialize common listen command section
document.addEventListener("DOMContentLoaded", async () => {
  elems.listenCommandSection = document.getElementById("listenCommand")

  // create ui representer for listen value
  const isMac = userIsMac()
  const representListen = createCommandRepresenterFor({
    container: document.getElementById("listenCommandRepresentation"),
    isMac,
  })
  const listenCommandPopup = document.getElementById("listenPopup")

  // set command listen keydown handler
  document.addEventListener("keydown", async (e) => {
    if (isListeningCommand) {
      e.preventDefault()

      // update state and ui
      currentCommandInput = createCommandInput(e)
      representListen(currentCommandInput)

      if (isAppropriateCommandInput(currentCommandInput)) {
        listenCommandPopup.classList.remove("notAppropriate")
      } else {
        listenCommandPopup.classList.add("notAppropriate")
      }
    }
  })

  // set cancel button click handler
  const listenCancelBtn = document.getElementById("listenCancelBtn")
  listenCancelBtn.addEventListener("click", () => {
    toggleListenCommandPopup()
  })

  // set save button click handler
  const listenSaveBtn = document.getElementById("listenSaveBtn")
  listenSaveBtn.addEventListener("click", () => {
    if (isAppropriateCommandInput(currentCommandInput)) {
      toggleListenCommandPopup()
    }
  })
})

// initialize popup preview section?
document.addEventListener("DOMContentLoaded", async () => {
  elems.foldPopupPreviewSection = document.getElementById("foldPopupPreview")
})

// // set listening command handlers
// document.addEventListener("DOMContentLoaded", async (e) => {
//   // initialize listen page command ui
//   const setPageCommandBtn = document.getElementById("setPageCommandBtn")
//   elems.listenCommandSection = document.getElementById("listenCommand")
//   const listenCommandInput = document.getElementById("listenCommandInput")
//   const listenCommandMsg = document.getElementById("listenCommandMsg")

//   chromeStorage.getSettings().then(({ pageCommand }) => {
//     setPageCommandBtn.textContent = stringifyCommandInput(pageCommand)
//     listenCommandInput.textContent = stringifyCommandInput(pageCommand)
//     currentCommandInput = pageCommand
//   })

//   // set toggle page command listen mode listeners
//   setPageCommandBtn.addEventListener("click", async (e) => {
//     if (await toggleListenCommandPopup())
//       currentListenOptionName = CMD_OPT_NAME.PAGE
//     // remove focus so that pressing enter key at listening mode is not clicking this button
//     e.target.blur()
//   })
//   // set toggle fold command listen mode handlers

//   // handlers for getting out of listening mode
//   elems.listenCommandSection.addEventListener("dblclick", (e) => {
//     toggleListenCommandPopup()
//   })

//   // handle command listen
//   document.addEventListener("keydown", async (e) => {
//     if (isListeningCommand) {
//       listenCommandMsg.textContent = ""

//       log("[keydown]", e)

//       if (e.key === "Escape") {
//         await toggleListenCommandPopup()
//       } else if (e.key === "Enter") {
//         await toggleListenCommandPopup()

//         // update button text
//         setPageCommandBtn.textContent =
//           stringifyCommandInput(currentCommandInput)

//         // update storage
//         const settings = await chromeStorage.getSettings()
//         settings.pageCommand = currentCommandInput
//         chrome.storage.sync.set({ settings })
//       } else if (keyIsCommandable(e.key)) {
//         // update current command object
//         currentCommandInput = createCommandInput(e)

//         listenCommandInput.textContent =
//           stringifyCommandInput(currentCommandInput)

//         if (__DEV) {
//           console.log("[listen] currentCommandInput", currentCommandInput)
//           console.log("[listen] e.key", e.key)
//         }
//       } else {
//         listenCommandInput.textContent = ""
//         listenCommandMsg.textContent = "Input Command is NOT appropriate."
//       }
//     }
//   })
// })

async function toggleListenCommandPopup() {
  // toggle state
  isListeningCommand = !isListeningCommand
  const isNowListening = isListeningCommand
  if (__DEV) log("[toggle mode] to ", isListeningCommand)

  // toggle listen section ui
  elems.listenCommandSection.classList.toggle("listening")

  // represent initial / result value
  const isMac = userIsMac()
  if (isNowListening) {
    const { pageCommand, foldCommand } = await chromeStorage.getSettings()
    // set initial listen input value to current option value
    const representListenInitial = createCommandRepresenterFor({
      container: document.getElementById("listenCommandRepresentation"),
      isMac,
    })
    // set initial value
    let initialValue
    if (currentListenOptionName === CMD_OPT_NAME.PAGE) {
      initialValue = pageCommand
    } else if (currentListenOptionName === CMD_OPT_NAME.FOLD) {
      initialValue = foldCommand
    }
    // set initial value
    representListenInitial(initialValue)
  } else {
    let representContainerId
    if (currentListenOptionName === CMD_OPT_NAME.PAGE) {
      representContainerId = "setPageCommandBtn"
    } else if (currentListenOptionName === CMD_OPT_NAME.FOLD) {
      representContainerId = "setFoldCommandBtn"
    }
    // create representer for option value
    let representResult = createCommandRepresenterFor({
      container: document.getElementById(representContainerId),
      isMac,
    })
    // set option result value
    representResult(currentCommandInput)
  }

  return isNowListening
}

async function representCommandToCurrentValue(settingName) {
  let representContainerId
  if (currentListenOptionName === CMD_OPT_NAME.PAGE) {
    representContainerId = "setPageCommandBtn"
  } else if (currentListenOptionName === CMD_OPT_NAME.FOLD) {
    representContainerId = "setFoldCommandBtn"
  }
  // create representer for option value
  let representResult = createCommandRepresenterFor({
    container: document.getElementById(representContainerId),
    isMac,
  })
  // set option result value
  representResult(currentCommandInput)
}

// async function

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
