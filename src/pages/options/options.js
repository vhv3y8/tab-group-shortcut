import * as chromeStorage from "../../chrome/storage"
import {
  isAppropriateCommandInput,
  createCommandInput,
  createCommandRepresenterFor,
  userIsMac,
  isAppropriateFoldCommand,
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

// state for checking reset all popup
let isCheckingResetAll = false

// state for popup preview
let isShowingFolPopupPreview

// common elements to handle
let elems = {
  listenCommandSection: undefined,
  foldPopupPreviewSection: undefined,
}

// initialize variables and ui with settings value
document.addEventListener("DOMContentLoaded", async (e) => {
  const settings = await chromeStorage.getSettings()
  const { pageCommand, foldCommand } = settings

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
    const checkbox = byId(id)
    // set checked value
    if (settings[option]) {
      checkbox.checked = true
    }
    // set checkbox toggle handler
    handleChange(checkbox, async (e) => {
      await updateStorageSettingOption((settings) => {
        settings[option] = e.target.checked
        return settings
      })
      if (__DEV) log(`${option}: ${e.target.checked}`)
    })
  }

  // enable fold command toggle disable stuff
  const enableFoldCommand = byId("enableFoldCommand")
  const foldArticle = byId("foldArticle")
  if (__DEV)
    log(`initial settings["enableFoldCommand"]`, settings.enableFoldCommand)
  // set initial
  if (settings.enableFoldCommand) {
    classAdd(foldArticle, "foldCommandEnabled")
  }
  // set handler
  handleChange(enableFoldCommand, (e) => {
    if (__DEV) log(`[enableFoldCommand] ${e.target.checked}`)
    ;(e.target.checked ? classAdd : classRm)(foldArticle, "foldCommandEnabled")
  })

  // 2. initialize non-checkbox ui

  // 1) command stuff
  const isMac = userIsMac()
  // const isMac = true
  const listenCommandRepresentation = byId("listenCommandRepresentation")
  const listenCommandPopupName = byId("listenCommandPopupName")

  // set group / ungroup command
  const setPageCommandBtn = byId("setPageCommandBtn")
  // show initial group / ungroup command value
  representOnce({
    container: setPageCommandBtn,
    isMac,
    commandInput: pageCommand,
  })
  // set click handler
  handleClick(setPageCommandBtn, async () => {
    let { pageCommand } = await chromeStorage.getSettings()
    // set states
    listeningCmdLookup = "PAGE"
    currentCommandInput = pageCommand
    // set ui
    listenCommandPopupName.textContent = "Group / Ungroup Command"
    representOnce({
      container: listenCommandRepresentation,
      isMac,
      commandInput: pageCommand,
    })
    // current value is not change
    classAdd(byId("listenPopup"), "notAppropriate")
    // open popup
    toggleListenCommandPopup()
  })

  // set fold / unfold command
  const setPageFoldCommandBtn = byId("setPageFoldCommandBtn")
  // show initial fold / unfold command value
  representOnce({
    container: setPageFoldCommandBtn,
    isMac,
    commandInput: foldCommand,
  })
  // set click handler
  handleClick(setPageFoldCommandBtn, async () => {
    let { foldCommand } = await chromeStorage.getSettings()
    // set states
    listeningCmdLookup = "FOLD"
    currentCommandInput = foldCommand
    // set ui
    listenCommandPopupName.textContent = "Fold / Unfold Command"
    representOnce({
      container: listenCommandRepresentation,
      isMac,
      commandInput: foldCommand,
    })
    // current value is not change
    classAdd(byId("listenPopup"), "notAppropriate")
    // open popup
    toggleListenCommandPopup()
  })

  // 2) other stuff

  // key string representation
  const controlSpans = document.querySelectorAll(".ctrlOrControl")
  controlSpans.forEach((span) => {
    span.textContent = "Control"
  })
  const altOrCmdSpans = document.querySelectorAll(".altOrCmd")
  altOrCmdSpans.forEach((span) => {
    span.textContent = "Command"
  })

  // copy shortcuts url
  const copyShortcutsUrl = byId("copyShortcutsUrl")
  // set click handler
  handleClick(copyShortcutsUrl, async (e) => {
    await navigator.clipboard.writeText("chrome://extensions/shortcuts")
    copyShortcutsUrl.classList.add("copied")
    await sleep(3000)
    copyShortcutsUrl.classList.remove("copied")
  })

  // focus item tab after unfold
  const focusItemTabAfterUnfoldIds = [
    "focusItemTabAfterUnfoldNo",
    "focusItemTabAfterUnfoldFirst",
    "focusItemTabAfterUnfoldLast",
  ]
  // initial value
  if (!settings.focusItemTabAfterUnfold.enable) {
    classAdd(byId("focusItemTabAfterUnfoldNoL"), "selected")
  } else if (!settings.focusItemTabAfterUnfold.firstOrLastGotoLast) {
    classAdd(byId("focusItemTabAfterUnfoldFirstL"), "selected")
  } else {
    classAdd(byId("focusItemTabAfterUnfoldLastL"), "selected")
  }
  // focus no handler
  byId("focusItemTabAfterUnfoldNo").addEventListener("change", async (e) => {
    await updateStorageSettingOption((settings) => {
      settings.focusItemTabAfterUnfold.enable = false
      return settings
    })
    // set ui
    classAdd(byId("focusItemTabAfterUnfoldNoL"), "selected")
    classRm(byId("focusItemTabAfterUnfoldFirstL"), "selected")
    classRm(byId("focusItemTabAfterUnfoldLastL"), "selected")
  })
  byId("focusItemTabAfterUnfoldFirst").addEventListener("change", async (e) => {
    await updateStorageSettingOption((settings) => {
      settings.focusItemTabAfterUnfold.enable = true
      settings.focusItemTabAfterUnfold.firstOrLastGotoLast = false
      return settings
    })
    // set ui
    classRm(byId("focusItemTabAfterUnfoldNoL"), "selected")
    classAdd(byId("focusItemTabAfterUnfoldFirstL"), "selected")
    classRm(byId("focusItemTabAfterUnfoldLastL"), "selected")
  })
  byId("focusItemTabAfterUnfoldLast").addEventListener("change", async (e) => {
    await updateStorageSettingOption((settings) => {
      settings.focusItemTabAfterUnfold.enable = true
      settings.focusItemTabAfterUnfold.firstOrLastGotoLast = true
      return settings
    })
    // set ui
    classRm(byId("focusItemTabAfterUnfoldNoL"), "selected")
    classRm(byId("focusItemTabAfterUnfoldFirstL"), "selected")
    classAdd(byId("focusItemTabAfterUnfoldLastL"), "selected")
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
  byId(`foldPopupPosition${settings.foldPopup.positionNumber}L`).classList.add(
    "selected",
  )
  // set click handlers
  for (const inputId of foldPopupPositionInputIds) {
    handleClick(byId(inputId), async (e) => {
      const positionNumber = parseInt(inputId.slice(-1))
      await updateStorageSettingOption((settings) => {
        // remove selected class from current value
        byId(
          `foldPopupPosition${settings.foldPopup.positionNumber}L`,
        ).classList.remove("selected")
        // set setting value and save
        settings.foldPopup.positionNumber = positionNumber
        return settings
      })
      // set ui
      byId(`${inputId}L`).classList.add("selected")
    })
  }

  // fold popup font size
  // const foldPopupFontSizeInput = byId("foldPopupFontSize")
  // const foldPopupFontSizeRangeInput = byId("foldPopupFontSizeRange")
  // // set initial value
  // foldPopupFontSizeInput.value = settings.foldPopup.fontSizePx
  // foldPopupFontSizeRangeInput.value = settings.foldPopup.fontSizePx
  // // set number change handler
  // handleChange(foldPopupFontSizeInput, async (e) => {
  //   if (__DEV) log(`foldPopupFontSizeInput e.target.value : ${e.target.value}`)
  //   await updateStorageSettingOption((settings) => {
  //     settings.foldPopup.fontSizePx = e.target.value
  //     foldPopupFontSizeRangeInput.value = e.target.value
  //     return settings
  //   })
  // })
  // // set range change handler
  // handleChange(foldPopupFontSizeRangeInput, async (e) => {
  //   if (__DEV)
  //     log(`foldPopupFontSizeRangeInput e.target.value : ${e.target.value}`)
  //   foldPopupFontSizeInput.value = e.target.value
  //   await updateStorageSettingOption((settings) => {
  //     settings.foldPopup.fontSizePx = e.target.value
  //     return settings
  //   })
  // })
  // set click handler?

  // fold popup darkmode
  // input radios
  const foldPopupExplicitDarkmodeAutomatic = byId(
    "foldPopupExplicitDarkmodeAutomatic",
  )
  const foldPopupExplicitDarkmodeLight = byId("foldPopupExplicitDarkmodeLight")
  const foldPopupExplicitDarkmodeDark = byId("foldPopupExplicitDarkmodeDark")
  // labels
  const foldPopupExplicitDarkmodeAutomaticL = byId(
    "foldPopupExplicitDarkmodeAutomaticL",
  )
  const foldPopupExplicitDarkmodeLightL = byId(
    "foldPopupExplicitDarkmodeLightL",
  )
  const foldPopupExplicitDarkmodeDarkL = byId("foldPopupExplicitDarkmodeDarkL")
  // initial value
  if (!settings.foldPopup.explicitDarkmode.enable) {
    classAdd(foldPopupExplicitDarkmodeAutomaticL, "selected")
  } else if (!settings.foldPopup.explicitDarkmode.darkmode) {
    classAdd(foldPopupExplicitDarkmodeLightL, "selected")
  } else {
    classAdd(foldPopupExplicitDarkmodeDarkL, "selected")
  }
  // automatic handler
  handleClick(foldPopupExplicitDarkmodeAutomatic, async (e) => {
    if (__DEV) log(`[foldPopupExplicitDarkmode] Automatic`)
    // change value and save
    await updateStorageSettingOption((settings) => {
      settings.foldPopup.explicitDarkmode.enable = false
      return settings
    })
    // set ui
    classAdd(foldPopupExplicitDarkmodeAutomaticL, "selected")
    classRm(foldPopupExplicitDarkmodeLightL, "selected")
    classRm(foldPopupExplicitDarkmodeDarkL, "selected")
  })
  // light handler
  handleClick(foldPopupExplicitDarkmodeLight, async (e) => {
    if (__DEV) log(`[foldPopupExplicitDarkmode] Light`)
    // change value and save
    await updateStorageSettingOption((settings) => {
      settings.foldPopup.explicitDarkmode.enable = true
      settings.foldPopup.explicitDarkmode.darkmode = false
      return settings
    })
    // set ui
    classRm(foldPopupExplicitDarkmodeAutomaticL, "selected")
    classAdd(foldPopupExplicitDarkmodeLightL, "selected")
    classRm(foldPopupExplicitDarkmodeDarkL, "selected")
  })
  // dark handler
  foldPopupExplicitDarkmodeDark.addEventListener("click", async (e) => {
    if (__DEV) log(`[foldPopupExplicitDarkmode] Dark`)
    // change value and save
    await updateStorageSettingOption((settings) => {
      settings.foldPopup.explicitDarkmode.enable = true
      settings.foldPopup.explicitDarkmode.darkmode = true
      return settings
    })
    // set ui
    classRm(foldPopupExplicitDarkmodeAutomaticL, "selected")
    classRm(foldPopupExplicitDarkmodeLightL, "selected")
    classAdd(foldPopupExplicitDarkmodeDarkL, "selected")
  })

  // explicit darkmode on extension pages
  // input radios
  const explicitDarkModeAutomatic = byId("explicitDarkModeAutomatic")
  const explicitDarkModeLight = byId("explicitDarkModeLight")
  const explicitDarkModeDark = byId("explicitDarkModeDark")
  // labels
  const explicitDarkModeAutomaticL = byId("explicitDarkModeAutomaticL")
  const explicitDarkModeLightL = byId("explicitDarkModeLightL")
  const explicitDarkModeDarkL = byId("explicitDarkModeDarkL")
  // initial value
  if (!settings.explicitDarkmode.enable) {
    classAdd(explicitDarkModeAutomaticL, "selected")
  } else if (!settings.explicitDarkmode.darkmode) {
    classAdd(explicitDarkModeLightL, "selected")
    classAdd(document.documentElement, "light")
    classRm(document.documentElement, "dark")
  } else {
    classAdd(explicitDarkModeDarkL, "selected")
    classRm(document.documentElement, "light")
    classAdd(document.documentElement, "dark")
  }
  // automatic handler
  explicitDarkModeAutomatic.addEventListener("click", async (e) => {
    if (__DEV) log(`[explicitDarkMode] Automatic`)
    await updateStorageSettingOption((settings) => {
      settings.explicitDarkmode.enable = false
      return settings
    })
    // set ui
    classAdd(explicitDarkModeAutomaticL, "selected")
    classRm(explicitDarkModeLightL, "selected")
    classRm(explicitDarkModeDarkL, "selected")
    classRm(document.documentElement, "light")
    classRm(document.documentElement, "dark")
  })
  // light handler
  explicitDarkModeLight.addEventListener("click", async (e) => {
    if (__DEV) log(`[explicitDarkMode] Light`)
    await updateStorageSettingOption((settings) => {
      settings.explicitDarkmode.enable = true
      settings.explicitDarkmode.darkmode = false
      return settings
    })
    // set ui
    classRm(explicitDarkModeAutomaticL, "selected")
    classAdd(explicitDarkModeLightL, "selected")
    classRm(explicitDarkModeDarkL, "selected")
    classAdd(document.documentElement, "light")
    classRm(document.documentElement, "dark")
  })
  // dark handler
  explicitDarkModeDark.addEventListener("click", async (e) => {
    if (__DEV) log(`[explicitDarkMode] Dark`)
    await updateStorageSettingOption((settings) => {
      settings.explicitDarkmode.enable = true
      settings.explicitDarkmode.darkmode = true
      return settings
    })
    // set ui
    classRm(explicitDarkModeAutomaticL, "selected")
    classRm(explicitDarkModeLightL, "selected")
    classAdd(explicitDarkModeDarkL, "selected")
    classRm(document.documentElement, "light")
    classAdd(document.documentElement, "dark")
  })
})

// initialize other elements

// initialize reset all options
document.addEventListener("DOMContentLoaded", async (e) => {
  const resetAll = byId("resetAll")

  // reset all button
  handleClick(resetAll, async () => {
    toggleResetAllCheckingPopup()
    isCheckingResetAll = true
  })
  // cancel button
  const resetCheckCancelBtn = byId("resetCheckCancelBtn")
  handleClick(resetCheckCancelBtn, async () => {
    toggleResetAllCheckingPopup()
    isCheckingResetAll = false
  })
  // background double click
  const resetCheckPopupBackground = byId("resetCheckPopupBackground")
  resetCheckPopupBackground.addEventListener("dblclick", async () => {
    toggleResetAllCheckingPopup()
    isCheckingResetAll = false
  })
  // ok button
  const resetCheckOkBtn = byId("resetCheckOkBtn")
  handleClick(resetCheckOkBtn, async () => {
    await toggleResetAllCheckingPopup()
    isCheckingResetAll = false
    // reset storage and reload page
    await chromeStorage.setStorage(chromeStorage.storageDefault)
    window.location.reload()
  })
})

// initialize common listen command section
document.addEventListener("DOMContentLoaded", async () => {
  elems.listenCommandSection = byId("listenCommand")

  // create ui representer for listen value
  const isMac = userIsMac()
  // const isMac = true
  const representListen = createCommandRepresenterFor({
    container: byId("listenCommandRepresentation"),
    isMac,
  })
  const listenCommandPopup = byId("listenPopup")

  // set cancel button click handler
  const listenCancelBtn = byId("listenCancelBtn")
  handleClick(listenCancelBtn, () => {
    if (__DEV) log("[cancel click]")
    toggleListenCommandPopup()
  })
  // set background double click handler
  const listenPopupBackground = byId("listenPopupBackground")
  listenPopupBackground.addEventListener("dblclick", () => {
    if (__DEV) log("[background dblclick]")
    toggleListenCommandPopup()
  })

  // set command listen keydown handler
  document.addEventListener("keydown", async (e) => {
    if (isListeningCommand) {
      e.preventDefault()
      if (__DEV) log(`[listening command]`, createCommandInput(e))
      // update state and ui
      currentCommandInput = createCommandInput(e)
      representListen(currentCommandInput)
      // fade if not appropriate
      let commandValidator
      if (listeningCmdLookup === "PAGE") {
        const isAppropriate = isAppropriateCommandInput(currentCommandInput)
        ;(isAppropriate ? classRm : classAdd)(
          listenCommandPopup,
          "notAppropriate",
        )
      } else if (listeningCmdLookup === "FOLD") {
        const isValid = isAppropriateCommandInput(currentCommandInput)
        const isAppropriate = isAppropriateFoldCommand(currentCommandInput)

        if (isValid && isAppropriate) {
          classRm(listenCommandPopup, "notAppropriate")
        } else if (!isAppropriate) {
          byId("listenPopupInfo").textContent = isMac
            ? "This command should include at least one key of Cmd, Option, Shift or Control."
            : "This command should include at least one key of Win, Ctrl, Alt or Shift."
          classAdd(listenCommandPopup, "notAppropriate")
        } else {
          byId("listenPopupInfo").textContent = "Listening..."
          classAdd(listenCommandPopup, "notAppropriate")
        }
      }
    }
  })

  // set save button click handler
  const listenSaveBtn = byId("listenSaveBtn")
  handleClick(listenSaveBtn, async () => {
    const commandValidator =
      listeningCmdLookup === "PAGE"
        ? isAppropriateCommandInput
        : isAppropriateFoldCommand
    if (commandValidator(currentCommandInput)) {
      await updateStorageSettingOption((settings) => {
        settings[lookup[listeningCmdLookup].optionName] = currentCommandInput
        if (__DEV) log(`[popup save btn] settings to save :`, settings)
        return settings
      })
      // set ui
      toggleListenCommandPopup()
      representOnce({
        container: byId(lookup[listeningCmdLookup].btnId),
        isMac,
      })
    }
  })
})

// initialize popup preview section?
document.addEventListener("DOMContentLoaded", async () => {
  elems.foldPopupPreviewSection = byId("foldPopupPreview")
})

// ui functions

async function toggleResetAllCheckingPopup() {
  const resetCheckPopup = byId("resetCheckPopup")
  const resetCheckPopupContent = byId("resetCheckPopupContent")
  const resetCheckPopupInfo = byId("resetCheckPopupInfo")

  if (isCheckingResetAll) {
    // out animation
    await Promise.all([
      transitionOut(resetCheckPopupInfo, [fly({ yStart: -5 }), fade()], {
        duration: 100,
        easing: easeInCubic,
      }),
      transitionOut(
        resetCheckPopupContent,
        [scale({ scaleStart: 0.95 }), fade()],
        {
          duration: 100,
          easing: easeOutCubic,
        },
      ),
    ])
    // remove
    resetCheckPopup.classList.remove("checking")
  } else {
    // add
    resetCheckPopup.classList.add("checking")
    // in animation
    await Promise.all([
      transitionIn(resetCheckPopupInfo, [fly({ yStart: -5 }), fade()], {
        duration: 100,
        easing: easeInCubic,
      }),
      transitionIn(
        resetCheckPopupContent,
        [scale({ scaleStart: 0.9 }), fade()],
        {
          duration: 100,
          easing: easeInCubic,
        },
      ),
    ])
  }
}

async function toggleListenCommandPopup() {
  // toggle state
  isListeningCommand = !isListeningCommand
  const isNowListening = isListeningCommand
  if (__DEV) log("[toggle mode] to ", isListeningCommand)

  // elements to animate
  const listenPopupDescription = byId("listenPopupDescription")
  const listenPopup = byId("listenPopup")
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
  byId("listenPopupInfo").textContent = "Listening..."

  return isNowListening
}

// representation functions

export function representOnce({
  container,
  isMac,
  commandInput = currentCommandInput,
}) {
  // create representer for option value
  let representResult = createCommandRepresenterFor({
    container,
    isMac,
  })
  // set option result value
  representResult(commandInput)
}

// utils

async function updateStorageSettingOption(updateSettingsAndReturn) {
  let settings = await chromeStorage.getSettings()
  settings = updateSettingsAndReturn(settings)
  await chromeStorage.setSettings(settings)
}

async function sleep(time) {
  return new Promise((res) => setTimeout(res, time))
}

// utils ui

function byId(id) {
  return document.getElementById(id)
}

function handleClick(element, callback) {
  element.addEventListener("click", callback)
}

function handleChange(element, callback) {
  element.addEventListener("change", callback)
}

// classlist

function classAdd(element, className) {
  element.classList.add(className)
}

function classRm(element, className) {
  element.classList.remove(className)
}

function classTg(element, className) {
  element.classList.toggle(className)
}

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
