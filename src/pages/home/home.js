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
