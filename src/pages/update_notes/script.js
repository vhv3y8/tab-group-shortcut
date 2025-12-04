import * as chromeStorage from "../../chrome/storage"

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
