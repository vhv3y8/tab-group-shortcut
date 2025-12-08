import * as chromeRuntime from "../../chrome/runtime"
import * as chromeStorage from "../../chrome/storage"
import { getInitialTabGroupId } from "../../chrome/tabGroups"
import { commandMatches } from "../content"

// export async function fetchAndAttachFoldPopup(shadowHost) {
//   // create shadow dom
//   const shadowRoot = shadowHost.attachShadow({ mode: "open" })
//   // get urls
//   const [htmlUrl, cssUrl] = await chromeRuntime.requestFoldPopupUrls()
//   if (__DEV) log("fetched urls", htmlUrl, cssUrl)
//   // get texts
//   const [html, css] = await Promise.all([
//     fetch(htmlUrl).then((r) => r.text()),
//     fetch(cssUrl).then((r) => r.text()),
//   ])
//   if (__DEV) log("raw", html, css)
//   // set shadow dom
//   shadowRoot.innerHTML = html

//   const rootElem = shadowRoot.querySelector("section")
//   rootElem.style.display = "none"

//   return rootElem
// }

export class ToggleGroupPopup {
  host
  rootElem
  tabgroups
  initialTabgroupIdx
  currentTabgroupIdx

  constructor(shadowHost, rootElem, tabgroups, initialTabgroupIdx) {
    this.host = shadowHost
    this.rootElem = rootElem
    this.tabgroups = tabgroups
    this.initialTabgroupIdx = initialTabgroupIdx
    this.currentTabgroupIdx = initialTabgroupIdx
  }

  static async init(shadowHost, tabgroups) {
    const rootElem = await ToggleGroupPopup.fetchAndAttachFoldPopup(shadowHost)

    const groupList = rootElem.getElementById("groupList")
    const initialGroupId = await getInitialTabGroupId()
    let initialTabgroupIdx = 0
    for (const [idx, { id, title, color, tabsCount }] of Object.entries(
      tabgroups,
    )) {
      groupList.appendChild(this.createListItem(idx, color, title, tabsCount))

      if (initialGroupId !== -1 && id === initialGroupId) {
        initialTabgroupIdx = idx
      }
    }
    // TODO
    return new ToggleGroupPopup(
      shadowHost,
      rootElem,
      tabgroups,
      groupList,
      initialTabgroupIdx,
    )
  }

  static async fetchAndAttachFoldPopup(shadowHost) {
    // create shadow dom
    const shadowRoot = shadowHost.attachShadow({ mode: "open" })
    // get urls
    const [htmlUrl, cssUrl] = await chromeRuntime.requestFoldPopupUrls()
    if (__DEV) log("fetched urls", htmlUrl, cssUrl)
    // get texts
    const [html, css] = await Promise.all(
      [htmlUrl, cssUrl].map((url) => fetch(url).then((r) => r.text())),
    )

    if (__DEV) log("raw", html, css)
    // set shadow dom
    shadowRoot.innerHTML = `
      <html>
      <head>
        <style>${css}</style>
      </head>
      <body>${html}</body>
      </html>
    `
    const rootElem = shadowRoot.querySelector("section")
    rootElem.style.display = "none"

    return rootElem
  }

  createListItem(idx, color, title, tabsCount) {
    const li = document.createElement("li")
    li.innerHTML = `<li id="groupIdx${idx}">
      <div class="chip ${color}"></div>
      <p>
        <span>${title}</span>
        <span>${tabsCount} ${1 < tabsCount ? "tabs" : "tab"}</span>
      </p>
    </li>`
    return li
  }

  // show and hide popup
  showPopup() {
    this.rootElem.style.display = ""
  }
  hidePopup() {
    this.rootElem.style.display = "none"
  }

  // move group
  async gotoInitialGroup() {
    const currentSelectedElem = this.rootElem.querySelector(
      `#groupIdx${this.initialTabgroupIdx}`,
    )
    currentSelectedElem.classList.add("selected")
  }
  gotoNextGroup() {
    this.rootElem
      .querySelector(`#groupIdx${this.currentTabgroupIdx}`)
      .classList.remove("selected")
    // update current index
    this.currentTabgroupIdx =
      (this.currentTabgroupIdx + 1) % this.tabgroups.length
    this.rootElem
      .querySelector(`#groupIdx${this.currentTabgroupIdx}`)
      .classList.add("selected")
  }

  // get group info to toggle
  getSelectedTabgroupInfo() {
    return this.tabgroups[currentTabgroupIdx]
  }
}

// state machine handling command keydown
export class ToggleGroupCommand {
  moveThreshold = 300
  foldCommand = {}
  isAllCommandKeyDown = false
  lastThresholdUpdatedAt = null

  constructor(foldCommand) {
    this.foldCommand = foldCommand
  }

  // basic

  allModifierKeyDown(commandInput) {
    // if all modiifers are down
    if (this.foldCommand.metaKey && !commandInput.metaKey) return false
    if (this.foldCommand.ctrlKey && !commandInput.ctrlKey) return false
    if (this.foldCommand.altKey && !commandInput.altKey) return false
    if (this.foldCommand.shiftKey && !commandInput.shiftKey) return false
    return true
  }

  allCommandKeyDown(commandInput) {
    return commandMatches(this.foldCommand, commandInput)
  }

  allKeyUp(commandInput) {
    return (
      !commandInput.metaKey &&
      !commandInput.ctrlKey &&
      !commandInput.altKey &&
      !commandInput.shiftKey
    )
  }

  checkPassedThresholdAndSet() {
    const current = performance.now()
    if (this.lastThresholdUpdatedAt === null) {
      this.lastThresholdUpdatedAt = current
      return true
    } else if (this.moveThreshold <= current - this.lastThresholdUpdatedAt) {
      this.lastThresholdUpdatedAt = current
      return true
    } else return false
  }

  // higher level

  shouldMoveToNext() {
    return this.isAllCommandKeyDown
  }
}

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
