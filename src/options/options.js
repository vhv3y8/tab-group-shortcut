let settings = await chrome.storage.sync.get(["settings"]).then((db) => {
  return db.settings
})
console.log(settings)

// initialize elements
let [turnOffForceCommandInput] = [
  document.getElementById("turnOffForceCommand"),
]

// set input values
if (settings.turnOffForceCommand) {
  turnOffForceCommandInput.checked = true
}

/* event listeners */

turnOffForceCommandInput.addEventListener("change", async (e) => {
  settings.turnOffForceCommand = e.target.checked

  await chrome.storage.sync.set({ settings })
})
