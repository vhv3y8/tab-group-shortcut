window.addEventListener("keydown", (e) => {
  if ((e.key === "G" || e.key === "g") && e.ctrlKey) {
    e.preventDefault()
    console.log("Ctrl+G Pressed, Toggling Group. (tab-group-shortcut)")
    chrome.runtime.sendMessage("TOGGLE_GROUP")
  }
})
