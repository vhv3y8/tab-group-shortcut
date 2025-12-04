export function userIsMac() {
  if (navigator.userAgent) {
    return navigator.userAgent.toUpperCase().includes("MAC")
  } else {
    return navigator.platform.toUpperCase().includes("MAC")
  }
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
  // TODO: maybe this is all possible?
  // TODO: mac specific keys?
  const notCommandableKeys = ["Meta", "Control", "Alt", "Shift"]

  return !notCommandableKeys.includes(commandInput.key)
}

// factory that creates function to apply ui with given command input object
export function createCommandRepresenterFor({ container, isMac }) {
  // handle os specific stuff only once
  container.classList.remove("mac", "window")
  container.classList.add(isMac ? "mac" : "window")

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
    const keySpan = container.querySelector(".inputKey")
    keySpan.textContent = key
  }
}

// export function stringifyCommandInput({
//   ctrlKey,
//   metaKey,
//   altKey,
//   shiftKey,
//   key,
// }) {
//   const commands = []
//   const isShiftSymbol = shiftSymbols.has(key)

//   if (metaKey) commands.push("Meta")
//   if (ctrlKey) commands.push("Ctrl")
//   if (altKey) commands.push("Alt")
//   // represent Shift+! as !
//   if (shiftKey && !isShiftSymbol) commands.push("Shift")
//   // represent ' ' as Space
//   commands.push(key === " " ? "Space" : key)

//   return commands.join(" + ")
// }

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
