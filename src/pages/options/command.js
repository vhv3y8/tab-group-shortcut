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

export function isAppropriateFoldCommand(commandInput) {
  const { metaKey, ctrlKey, altKey, shiftKey } = commandInput
  return metaKey || ctrlKey || altKey || shiftKey
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

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
