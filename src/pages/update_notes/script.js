import * as chromeStorage from "../../chrome/storage"

// apply explicit darkmode
document.addEventListener("DOMContentLoaded", async () => {
  let settings = await chromeStorage.getSettings()
  if (settings.explicitDarkmode.enable) {
    if (settings.explicitDarkmode.darkmode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.add("light")
    }
  }
})

document.addEventListener("DOMContentLoaded", () => {
  // don't show this page at extension update button
  const disableOpenUpdateNotesPageBtn = document.getElementById(
    "disableOpenUpdateNotesPage",
  )
  // set click handler
  disableOpenUpdateNotesPageBtn.addEventListener("click", async () => {
    // get current settings
    let settings = await chromeStorage.getSettings()
    // change open update notes option to false
    settings.openUpdateNotesPageOnExtensionUpdate = false
    if (__DEV) console.log("[updated settings]", settings)

    // update storage
    await chromeStorage.setSettings(settings)
    // close window
    window.close()
  })
})
