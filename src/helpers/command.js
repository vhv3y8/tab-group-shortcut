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
