export async function userIsMac() {
  if (navigator.userAgentData?.getHighEntropyValues) {
    try {
      const { platform } = await navigator.userAgentData.getHighEntropyValues([
        "platform",
      ])
      if (platform) return platform.toUpperCase().includes("MAC")
    } catch {}
  }

  const ua = navigator.userAgent || ""
  const pf = navigator.platform || ""

  return ua.toUpperCase().includes("MAC") || pf.toUpperCase().includes("MAC")
}

// create command input object from web api keyboard event
export function createCommandInput(keyboardEvent) {
  let { metaKey, ctrlKey, altKey, shiftKey, key } = keyboardEvent
  // capitalize letter, and keep other strings like caps lock, escape, tab
  if (key.length === 1 && "a" <= key && key <= "z") key = key.toUpperCase()
  return {
    metaKey,
    ctrlKey,
    altKey,
    shiftKey,
    key,
  }
}

export function isAppropriateCommandInput(commandInput) {
  // TODO: mac specific keys?
  const notCommandableKeys = ["Meta", "Control", "Alt", "Shift"]
  return !notCommandableKeys.includes(commandInput.key)
}

// factory that creates function to apply ui with given command input object
export function createCommandRepresenterFor({ container, isMac }) {
  // handle os specific stuff only once
  container.classList.remove("macos", "window")
  container.classList.add(isMac ? "macos" : "window")
  // all representations are handled by changing container class names.
  // container element should have appropriate children elements.
  return function representCommandInput(commandInput) {
    // reset classlist
    container.classList.remove("metaKey", "ctrlKey", "altKey", "shiftKey")
    // set class name for command
    const { ctrlKey, metaKey, altKey, shiftKey, key } = commandInput
    if (metaKey) container.classList.add("metaKey")
    if (ctrlKey) container.classList.add("ctrlKey")
    if (altKey) container.classList.add("altKey")
    if (shiftKey) container.classList.add("shiftKey")
    // set key text
    const keySpan = container.querySelector(
      `${isMac ? ".mac" : ".win"} .inputKey`,
    )
    keySpan.textContent = key
  }
}

// // // // // // // // // // // // // // // // // // // //

/**
 * Binds <input type="checkbox"> switch element to storage setting value.
 * @param {HTMLInputElement} element
 * @param {string} settingName
 */
export async function bindInputElemToSettingValue(element, settingName) {
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

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
