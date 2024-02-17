document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "G" || e.key === "g")) {
    e.preventDefault()
    console.log("Ctrl+G Pressed, Creating Group. (tab-group-shortcut)")
    chrome.runtime.sendMessage("CREATE_GROUP")
  }
})
