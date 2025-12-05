import * as chromeStorage from "../../chrome/storage"
import {
  isAppropriateCommandInput,
  createCommandInput,
  createCommandRepresenterFor,
  userIsMac,
} from "./command"
import {
  easeInCubic,
  easeOutCubic,
  fade,
  fly,
  scale,
  transitionIn,
  transitionOut,
} from "./transition"

const lookup = {
  PAGE: {
    optionName: "pageCommand",
    btnId: "setPageCommandBtn",
  },
  FOLD: {
    optionName: "foldCommand",
    btnId: "setPageFoldCommandBtn",
  },
}

// states for listening command
let isListeningCommand = false
let listeningCmdLookup = "PAGE"
let currentCommandInput = {}
// listeningCmdLookup

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
  // set initial checked value and set handlers
  for (const option of boolOptions) {
    // should be both storage settings property name, and options html input checkbox id
    const id = option
    const checkbox = document.getElementById(id)
    // set checked value
    if (settings[option]) {
      checkbox.checked = true
    }
    // set checkbox toggle handler
    checkbox.addEventListener("change", async (e) => {
      let settings = await chromeStorage.getSettings()
      settings[option] = e.target.checked
      await chromeStorage.setSettings(settings)

      if (__DEV) log(`${option}: ${e.target.checked}`)
    })
  }

  // enable fold command toggle disable stuff
  const enableFoldCommand = document.getElementById("enableFoldCommand")
  const foldArticle = document.getElementById("foldArticle")
  if (__DEV)
    log(`initial settings["enableFoldCommand"]`, settings["enableFoldCommand"])
  // set initial
  if (settings["enableFoldCommand"]) {
    foldArticle.classList.add("foldCommandEnabled")
  } else {
    foldArticle.classList.remove("foldCommandEnabled")
  }
  // set handler
  enableFoldCommand.addEventListener("change", (e) => {
    if (__DEV) log(`[enableFoldCommand] ${e.target.checked}`)
    if (e.target.checked) {
      foldArticle.classList.add("foldCommandEnabled")
    } else {
      foldArticle.classList.remove("foldCommandEnabled")
    }
  })

  // 2. initialize non-checkbox ui

  // 1) command stuff
  const isMac = userIsMac()
  // const isMac = true
  const listenCommandRepresentation = document.getElementById(
    "listenCommandRepresentation",
  )
  const listenCommandPopupName = document.getElementById(
    "listenCommandPopupName",
  )

  // set group / ungroup command
  const setPageCommandBtn = document.getElementById("setPageCommandBtn")
  // show initial group / ungroup command value
  createCommandRepresenterFor({ container: setPageCommandBtn, isMac })(
    pageCommand,
  )
  // set click handler
  setPageCommandBtn.addEventListener("click", async () => {
    let { pageCommand } = await chromeStorage.getSettings()
    // set states
    listeningCmdLookup = "PAGE"
    currentCommandInput = pageCommand
    // set ui
    listenCommandPopupName.textContent = "Group / Ungroup Command"
    createCommandRepresenterFor({
      container: listenCommandRepresentation,
      isMac,
    })(currentCommandInput)
    // current value is not change
    document.getElementById("listenPopup").classList.add("notAppropriate")
    // open popup
    toggleListenCommandPopup()
  })

  // set fold / unfold command
  const setPageFoldCommandBtn = document.getElementById("setPageFoldCommandBtn")
  // show initial fold / unfold command value
  createCommandRepresenterFor({ container: setPageFoldCommandBtn, isMac })(
    foldCommand,
  )
  // set click handler
  setPageFoldCommandBtn.addEventListener("click", async () => {
    let { foldCommand } = await chromeStorage.getSettings()
    // set states
    listeningCmdLookup = "FOLD"
    currentCommandInput = foldCommand
    // set ui
    listenCommandPopupName.textContent = "Fold / Unfold Command"
    createCommandRepresenterFor({
      container: listenCommandRepresentation,
      isMac,
    })(currentCommandInput)
    // current value is not change
    document.getElementById("listenPopup").classList.add("notAppropriate")
    // open popup
    toggleListenCommandPopup()
  })

  // 2) other stuff

  // copy shortcuts url
  const copyShortcutsUrl = document.getElementById("copyShortcutsUrl")
  // set click handler
  copyShortcutsUrl.addEventListener("click", async (e) => {
    await navigator.clipboard.writeText("chrome://extensions/shortcuts")
    copyShortcutsUrl.classList.add("copied")
    setTimeout(() => {
      copyShortcutsUrl.classList.remove("copied")
    }, 3000)
  })

  // fold popup position
  const foldPopupPositionInputIds = [
    "foldPopupPosition1",
    "foldPopupPosition2",
    "foldPopupPosition3",
    "foldPopupPosition4",
    "foldPopupPosition5",
    "foldPopupPosition6",
    "foldPopupPosition7",
    "foldPopupPosition8",
    "foldPopupPosition9",
  ]
  // set initial value
  document
    .getElementById(`foldPopupPosition${settings.foldPopup.positionNumber}L`)
    .classList.add("selected")
  // set click handlers
  for (const inputId of foldPopupPositionInputIds) {
    document.getElementById(inputId).addEventListener("click", async (e) => {
      let settings = await chromeStorage.getSettings()
      const positionNumber = parseInt(inputId.slice(-1))
      // remove selected class from current value
      document
        .getElementById(
          `foldPopupPosition${settings.foldPopup.positionNumber}L`,
        )
        .classList.remove("selected")
      // set setting value and save
      settings.foldPopup.positionNumber = positionNumber
      await chromeStorage.setSettings(settings)
      // set ui
      document.getElementById(`${inputId}L`).classList.add("selected")
    })
  }

  // fold popup font size
  const foldPopupFontSizeInput = document.getElementById("foldPopupFontSize")
  const foldPopupFontSizeRangeInput = document.getElementById(
    "foldPopupFontSizeRange",
  )
  // set initial value
  foldPopupFontSizeInput.value = settings.foldPopup.fontSizePx
  foldPopupFontSizeRangeInput.value = settings.foldPopup.fontSizePx
  // set number change handler
  foldPopupFontSizeInput.addEventListener("change", async (e) => {
    if (__DEV) log(`foldPopupFontSizeInput e.target.value : ${e.target.value}`)
    let settings = await chromeStorage.getSettings()
    settings.foldPopup.fontSizePx = e.target.value
    foldPopupFontSizeRangeInput.value = e.target.value
    await chromeStorage.setSettings(settings)
  })
  // set range change handler
  foldPopupFontSizeRangeInput.addEventListener("change", async (e) => {
    if (__DEV)
      log(`foldPopupFontSizeRangeInput e.target.value : ${e.target.value}`)
    let settings = await chromeStorage.getSettings()
    settings.foldPopup.fontSizePx = e.target.value
    foldPopupFontSizeInput.value = e.target.value
    await chromeStorage.setSettings(settings)
  })
  // set click handler?

  // fold popup darkmode
  // input radios
  const foldPopupExplicitDarkmodeAutomatic = document.getElementById(
    "foldPopupExplicitDarkmodeAutomatic",
  )
  const foldPopupExplicitDarkmodeLight = document.getElementById(
    "foldPopupExplicitDarkmodeLight",
  )
  const foldPopupExplicitDarkmodeDark = document.getElementById(
    "foldPopupExplicitDarkmodeDark",
  )
  // labels
  const foldPopupExplicitDarkmodeAutomaticL = document.getElementById(
    "foldPopupExplicitDarkmodeAutomaticL",
  )
  const foldPopupExplicitDarkmodeLightL = document.getElementById(
    "foldPopupExplicitDarkmodeLightL",
  )
  const foldPopupExplicitDarkmodeDarkL = document.getElementById(
    "foldPopupExplicitDarkmodeDarkL",
  )
  // initial value
  if (!settings.foldPopup.explicitDarkmode) {
    foldPopupExplicitDarkmodeAutomaticL.classList.add("selected")
  } else if (!settings.foldPopup.darkmode) {
    foldPopupExplicitDarkmodeLightL.classList.add("selected")
  } else {
    foldPopupExplicitDarkmodeDarkL.classList.add("selected")
  }
  // automatic handler
  foldPopupExplicitDarkmodeAutomatic.addEventListener("click", async (e) => {
    if (__DEV) log(`[foldPopupExplicitDarkmode] Automatic`)
    let settings = await chromeStorage.getSettings()
    // change value and save
    settings.foldPopup.explicitDarkmode = false
    await chromeStorage.setSettings(settings)
    // set ui
    foldPopupExplicitDarkmodeAutomaticL.classList.add("selected")
    foldPopupExplicitDarkmodeLightL.classList.remove("selected")
    foldPopupExplicitDarkmodeDarkL.classList.remove("selected")
  })
  // light handler
  foldPopupExplicitDarkmodeLight.addEventListener("click", async (e) => {
    if (__DEV) log(`[foldPopupExplicitDarkmode] Light`)
    let settings = await chromeStorage.getSettings()
    // change value and save
    settings.foldPopup.explicitDarkmode = true
    settings.foldPopup.darkmode = false
    await chromeStorage.setSettings(settings)
    // set ui
    foldPopupExplicitDarkmodeAutomaticL.classList.remove("selected")
    foldPopupExplicitDarkmodeLightL.classList.add("selected")
    foldPopupExplicitDarkmodeDarkL.classList.remove("selected")
  })
  // dark handler
  foldPopupExplicitDarkmodeDark.addEventListener("click", async (e) => {
    if (__DEV) log(`[foldPopupExplicitDarkmode] Dark`)
    let settings = await chromeStorage.getSettings()
    // change value and save
    settings.foldPopup.explicitDarkmode = true
    settings.foldPopup.darkmode = true
    await chromeStorage.setSettings(settings)
    // set ui
    foldPopupExplicitDarkmodeAutomaticL.classList.remove("selected")
    foldPopupExplicitDarkmodeLightL.classList.remove("selected")
    foldPopupExplicitDarkmodeDarkL.classList.add("selected")
  })

  // explicit darkmode on extension pages
  // input radios
  const explicitDarkModeAutomatic = document.getElementById(
    "explicitDarkModeAutomatic",
  )
  const explicitDarkModeLight = document.getElementById("explicitDarkModeLight")
  const explicitDarkModeDark = document.getElementById("explicitDarkModeDark")
  // labels
  const explicitDarkModeAutomaticL = document.getElementById(
    "explicitDarkModeAutomaticL",
  )
  const explicitDarkModeLightL = document.getElementById(
    "explicitDarkModeLightL",
  )
  const explicitDarkModeDarkL = document.getElementById("explicitDarkModeDarkL")
  // initial value
  if (!settings.foldPopup.explicitDarkmode) {
    explicitDarkModeAutomaticL.classList.add("selected")
  } else if (!settings.foldPopup.darkmode) {
    explicitDarkModeLightL.classList.add("selected")
    document.documentElement.classList.add("light")
    document.documentElement.classList.remove("dark")
  } else {
    explicitDarkModeDarkL.classList.add("selected")
    document.documentElement.classList.remove("light")
    document.documentElement.classList.add("dark")
  }
  // automatic handler
  explicitDarkModeAutomatic.addEventListener("click", async (e) => {
    if (__DEV) log(`[explicitDarkMode] Automatic`)
    let settings = await chromeStorage.getSettings()
    // change value and save
    settings.explicitDarkmode = false
    await chromeStorage.setSettings(settings)
    // set ui
    explicitDarkModeAutomaticL.classList.add("selected")
    explicitDarkModeLightL.classList.remove("selected")
    explicitDarkModeDarkL.classList.remove("selected")
    document.documentElement.classList.remove("light")
    document.documentElement.classList.remove("dark")
  })
  // light handler
  explicitDarkModeLight.addEventListener("click", async (e) => {
    if (__DEV) log(`[explicitDarkMode] Light`)
    let settings = await chromeStorage.getSettings()
    // change value and save
    settings.explicitDarkmode = true
    settings.darkmode = false
    await chromeStorage.setSettings(settings)
    // set ui
    explicitDarkModeAutomaticL.classList.remove("selected")
    explicitDarkModeLightL.classList.add("selected")
    explicitDarkModeDarkL.classList.remove("selected")
    document.documentElement.classList.add("light")
    document.documentElement.classList.remove("dark")
  })
  // dark handler
  explicitDarkModeDark.addEventListener("click", async (e) => {
    if (__DEV) log(`[explicitDarkMode] Dark`)
    let settings = await chromeStorage.getSettings()
    // change value and save
    settings.explicitDarkmode = true
    settings.darkmode = true
    await chromeStorage.setSettings(settings)
    // set ui
    explicitDarkModeAutomaticL.classList.remove("selected")
    explicitDarkModeLightL.classList.remove("selected")
    explicitDarkModeDarkL.classList.add("selected")
    document.documentElement.classList.remove("light")
    document.documentElement.classList.add("dark")
  })
})

// initialize common listen command section
document.addEventListener("DOMContentLoaded", async () => {
  elems.listenCommandSection = document.getElementById("listenCommand")

  // create ui representer for listen value
  const isMac = userIsMac()
  // const isMac = true
  const representListen = createCommandRepresenterFor({
    container: document.getElementById("listenCommandRepresentation"),
    isMac,
  })
  const listenCommandPopup = document.getElementById("listenPopup")

  // set command listen keydown handler
  document.addEventListener("keydown", async (e) => {
    if (isListeningCommand) {
      e.preventDefault()
      if (__DEV) log(`[listening command]`, createCommandInput(e))

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
    if (__DEV) log("[cancel click]")
    toggleListenCommandPopup()
  })
  // set background double click handler
  const listenPopupBackground = document.getElementById("listenPopupBackground")
  listenPopupBackground.addEventListener("dblclick", () => {
    if (__DEV) log("[background dblclick]")
    toggleListenCommandPopup()
  })

  // set save button click handler
  const listenSaveBtn = document.getElementById("listenSaveBtn")
  listenSaveBtn.addEventListener("click", async () => {
    if (isAppropriateCommandInput(currentCommandInput)) {
      // get settings
      let settings = await chromeStorage.getSettings()
      // update settings value and save
      settings[lookup[listeningCmdLookup].optionName] = currentCommandInput

      if (__DEV) log(`[popup save btn] settings to save :`, settings)
      await chromeStorage.setSettings(settings)
      // set ui
      toggleListenCommandPopup()
      let btnId = lookup[listeningCmdLookup].btnId
      createCommandRepresenterFor({
        container: document.getElementById(btnId),
        isMac,
      })(currentCommandInput)
    }
  })
})

// initialize popup preview section?
document.addEventListener("DOMContentLoaded", async () => {
  elems.foldPopupPreviewSection = document.getElementById("foldPopupPreview")
})

// ui functions

async function toggleListenCommandPopup() {
  // toggle state
  isListeningCommand = !isListeningCommand
  const isNowListening = isListeningCommand
  if (__DEV) log("[toggle mode] to ", isListeningCommand)

  // elements to animate
  const listenPopupDescription = document.getElementById(
    "listenPopupDescription",
  )
  const listenPopup = document.getElementById("listenPopup")
  if (isNowListening) {
    // add before in animation
    elems.listenCommandSection.classList.add("listening")
    // in animation
    await Promise.all([
      transitionIn(listenPopupDescription, [fly({ yStart: -5 }), fade()], {
        duration: 100,
        easing: easeInCubic,
      }),
      transitionIn(
        listenPopup,
        [scale({ scaleStart: 0.9, scaleEnd: 1 }), fade()],
        {
          duration: 100,
          easing: easeOutCubic,
        },
      ),
    ])
  } else {
    // out animation
    await Promise.all([
      transitionOut(listenPopupDescription, [fly({ yStart: -5 }), fade()], {
        duration: 100,
        easing: easeInCubic,
      }),
      transitionOut(
        listenPopup,
        [scale({ scaleStart: 0.95, scaleEnd: 1 }), fade()],
        {
          duration: 200,
          easing: easeInCubic,
        },
      ),
    ])
    // remove after out animation
    elems.listenCommandSection.classList.remove("listening")
  }

  // represent initial / result value
  // const isMac = userIsMac()
  // if (isNowListening) {
  //   const { pageCommand, foldCommand } = await chromeStorage.getSettings()
  //   // set initial listen input value to current option value
  //   const representListenInitial = createCommandRepresenterFor({
  //     container: document.getElementById("listenCommandRepresentation"),
  //     isMac,
  //   })
  //   // set initial value
  //   let initialValue
  //   if (listeningCmdLookup === CMD_OPT_NAME.PAGE) {
  //     initialValue = pageCommand
  //   } else if (listeningCmdLookup === CMD_OPT_NAME.FOLD) {
  //     initialValue = foldCommand
  //   }
  //   // set initial value
  //   representListenInitial(initialValue)
  // } else {
  //   let representContainerId
  //   if (listeningCmdLookup === CMD_OPT_NAME.PAGE) {
  //     representContainerId = "setPageCommandBtn"
  //   } else if (listeningCmdLookup === CMD_OPT_NAME.FOLD) {
  //     representContainerId = "setPageFoldCommandBtn"
  //   }
  //   // create representer for option value
  //   let representResult = createCommandRepresenterFor({
  //     container: document.getElementById(representContainerId),
  //     isMac,
  //   })
  //   // set option result value
  //   representResult(currentCommandInput)
  // }

  return isNowListening
}

function showFoldPopupPreviewTransition() {}

// representation functions

async function representCurrentOnce({ btnId, isMac }) {
  const container = document.getElementById(btnId)
  // create representer for option value
  let representResult = createCommandRepresenterFor({
    container,
    isMac,
  })
  // set option result value
  representResult(currentCommandInput)
}

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
//       listeningCmdLookup = CMD_OPT_NAME.PAGE
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

// async function representCommandToCurrentValue(settingName) {
//   let representContainerId
//   if (listeningCmdLookup === CMD_OPT_NAME.PAGE) {
//     representContainerId = "setPageCommandBtn"
//   } else if (listeningCmdLookup === CMD_OPT_NAME.FOLD) {
//     representContainerId = "setPageFoldCommandBtn"
//   }
//   // create representer for option value
//   let representResult = createCommandRepresenterFor({
//     container: document.getElementById(representContainerId),
//     isMac,
//   })
//   // set option result value
//   representResult(currentCommandInput)
// }

// async function

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
