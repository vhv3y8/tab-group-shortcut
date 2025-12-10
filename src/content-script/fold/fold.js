import * as chromeRuntime from "../../chrome/runtime"
import { commandMatches } from "../content"

export class ToggleGroupPopup {
  host
  rootElem
  tabgroups
  initialTabgroupIdx
  currentTabgroupIdx
  liElems
  positionNumber

  constructor(shadowHost, rootElem, tabgroups, initialTabgroupIdx, liElems) {
    this.host = shadowHost
    this.rootElem = rootElem
    this.tabgroups = tabgroups
    this.initialTabgroupIdx = initialTabgroupIdx
    this.currentTabgroupIdx = initialTabgroupIdx
    this.liElems = liElems
    // use updatePopupPosition to update
    this.positionNumber = 1

    if (__DEV)
      log("[{ shadowHost, rootElem, tabgroups, initialTabgroupIdx }]", {
        shadowHost,
        rootElem,
        tabgroups,
        initialTabgroupIdx,
      })
  }

  static async init(shadowHost, tabgroups) {
    const rootElem = await ToggleGroupPopup.fetchAndAttachFoldPopup(shadowHost)
    const extensionUrlPrefix = chrome.runtime.getURL("")

    const groupList = rootElem.querySelector("#groupList")
    let liElems = []
    const initialGroupId = await chromeRuntime.requestInitialTabGroupId()

    let initialTabgroupIdx = 0
    for (const [
      idx,
      { id, color, title, folded, tabsCount, tabTitlesCombined },
    ] of Object.entries(tabgroups)) {
      const listItem = ToggleGroupPopup.createListItem(
        idx,
        color,
        title || tabTitlesCombined,
        folded,
        tabsCount,
        extensionUrlPrefix,
      )
      groupList.appendChild(listItem)
      liElems.push(listItem)

      if (initialGroupId !== -1 && id === initialGroupId) {
        initialTabgroupIdx = idx
      }
    }

    if (__DEV) log("[extensionUrlPrefix]", extensionUrlPrefix)
    // TODO
    return new ToggleGroupPopup(
      shadowHost,
      rootElem,
      tabgroups,
      initialTabgroupIdx,
      liElems,
    )
  }

  // reset
  async updateGroupsAndIndexes(tabgroups) {
    const initialGroupId = await chromeRuntime.requestInitialTabGroupId()
    const extensionUrlPrefix = chrome.runtime.getURL("")
    // create popup ui again
    const groupList = this.rootElem.querySelector("#groupList")
    groupList.innerHTML = ""
    let liElems = []
    let initialTabgroupIdx = 0
    for (const [
      idx,
      { id, color, title, folded, tabsCount, tabTitlesCombined },
    ] of Object.entries(tabgroups)) {
      const listItem = ToggleGroupPopup.createListItem(
        idx,
        color,
        title || tabTitlesCombined,
        folded,
        tabsCount,
        extensionUrlPrefix,
      )
      groupList.appendChild(listItem)
      liElems.push(listItem)

      if (initialGroupId !== -1 && id === initialGroupId) {
        initialTabgroupIdx = idx
      }
    }
    // update fields
    this.tabgroups = tabgroups
    this.liElems = liElems
    this.liElems[this.currentTabgroupIdx].classList.remove("selected")
    this.initialTabgroupIdx = initialTabgroupIdx
    this.currentTabgroupIdx = initialTabgroupIdx
  }

  static async fetchAndAttachFoldPopup(shadowHost) {
    // create shadow dom
    const shadowRoot = shadowHost.attachShadow({ mode: "closed" })
    // get urls
    const [htmlUrl, cssUrl] = await chromeRuntime.requestFoldPopupUrls()
    if (__DEV) log("fetched urls", htmlUrl, cssUrl)
    // get texts
    const [html, css] = await Promise.all(
      [htmlUrl, cssUrl].map((url) => fetch(url).then((r) => r.text())),
    )
    // if (__DEV) log("raw", html, css)

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
    rootElem.style.pointerEvents = "none"

    const { width: scrollBarWidth } = getScrollbarSize()
    if (getScrollbarSide() === "left") {
      rootElem.style.paddingLeft = `${scrollBarWidth}px`
    } else {
      rootElem.style.paddingRight = `${scrollBarWidth}px`
    }
    rootElem.style.width = `calc(100vw - ${`${scrollBarWidth}px`})`

    return rootElem
  }

  static createListItem(
    idx,
    color,
    title,
    folded,
    tabsCount,
    extensionUrlPrefix,
  ) {
    const li = document.createElement("li")
    li.innerHTML = `
      <div class="chip ${color}"></div>
      <p class="title grow whitespace-nowrap overflow-hidden text-ellipsis">
      </p>
      <div class="tabs flex items-center">
        <img src="${extensionUrlPrefix.concat("fold-light.svg")}" alt="| FOLDED" class="hidden dark;hidden light:group-[.folded]:inline size-4.5 mr-2"></img>
        <img src="${extensionUrlPrefix.concat("fold-dark.svg")}" alt="| FOLDED" class="hidden light:hidden dark:group-[.folded]:inline size-4.5 mr-2"></img>

        <img src="${extensionUrlPrefix.concat("tab-light.svg")}" alt="| " class="light:inline dark:hidden size-4"></img>
        <img src="${extensionUrlPrefix.concat("tab-dark.svg")}" alt="| " class="light:hidden dark:inline size-4"></img>
        <span class="ml-1">${tabsCount}</span>
      </div>
    `
    li.id = `groupIdx${idx}`
    li.classList.add("group")
    li.querySelector(".title").textContent = title
    if (folded) li.classList.add("folded")
    return li
  }

  // show and hide popup
  showPopup() {
    this.host.style.display = ""
    this.rootElem.style.display = ""

    // reverse scale tab zoom ratio to show consistent size popup
    const positionNumberToTransformOrigin = {
      1: "top left",
      2: "top center",
      3: "top right",
      4: "center left",
      5: "center",
      6: "center right",
      7: "bottom left",
      8: "bottom center",
      9: "bottom right",
    }
    const zoomRatio = window.outerWidth / window.innerWidth
    this.rootElem.style.transformOrigin =
      positionNumberToTransformOrigin[this.positionNumber]
    this.rootElem.style.transform = `scale(${1 / zoomRatio})`
  }
  hidePopup() {
    this.host.style.display = "none"
    this.rootElem.style.display = ""
  }

  updatePopupPosition(number) {
    this.rootElem.classList.remove(
      "popup-position-1",
      "popup-position-2",
      "popup-position-3",
      "popup-position-4",
      "popup-position-5",
      "popup-position-6",
      "popup-position-7",
      "popup-position-8",
      "popup-position-9",
    )
    this.rootElem.classList.add(`popup-position-${number}`)
    this.positionNumber = number
  }

  // setFontSize(fontSize) {
  //   this.rootElem.style.fontSize = fontSize
  // }

  setExplicitDarkmode(dark) {
    this.host.classList.add(dark ? "dark" : "light")
  }

  // move group
  async gotoInitialGroup() {
    this.liElems[this.initialTabgroupIdx].classList.add("selected")
  }
  gotoNextGroup() {
    if (this.tabgroups.length === 0) return
    this.liElems[this.currentTabgroupIdx].classList.remove("selected")
    // update current index
    this.currentTabgroupIdx =
      (this.currentTabgroupIdx + 1) % this.tabgroups.length
    this.liElems[this.currentTabgroupIdx].classList.add("selected")
  }

  // get group info to toggle
  getSelectedTabgroupId() {
    if (this.tabgroups.length === 0) return -1
    return this.tabgroups[this.currentTabgroupIdx].id
  }
}

// state machine handling command keydown
export class ToggleGroupCommand {
  moveThreshold = 50
  foldCommand = {}
  lastThresholdUpdatedAt = null

  constructor(foldCommand) {
    this.foldCommand = foldCommand
  }

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

  escapePressed(commandInput) {
    if (commandInput.key.toUpperCase() === "ESCAPE") {
      this.lastThresholdUpdatedAt = null
      return true
    } else return false
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
}

// utils

function getScrollbarSide() {
  const div = document.createElement("div")
  div.dir = "auto"
  div.style.width = "100px"
  div.style.height = "100px"
  div.style.overflow = "scroll"
  div.style.visibility = "hidden"

  const inner = document.createElement("div")
  inner.style.height = "200px"
  div.appendChild(inner)

  document.body.appendChild(div)

  const isLeft = div.scrollLeft > 0
  document.body.removeChild(div)

  return isLeft ? "left" : "right"
}

function getScrollbarSize() {
  const div = document.createElement("div")
  div.style.width = "100px"
  div.style.height = "100px"
  div.style.overflow = "scroll"
  div.style.position = "absolute"
  div.style.top = "-9999px"

  document.body.appendChild(div)
  const w = div.offsetWidth - div.clientWidth
  const h = div.offsetHeight - div.clientHeight
  document.body.removeChild(div)
  return { width: w, height: h }
}

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut]`, ...anything)
}
