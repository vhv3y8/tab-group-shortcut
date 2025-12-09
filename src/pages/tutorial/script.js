import { userIsMac } from "../options/command"
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

document.addEventListener("DOMContentLoaded", async () => {
  // change representation for mac
  const isMac = await userIsMac()
  // const isMac = true
  if (__DEV) console.log("[isMac]", isMac)
  if (isMac) {
    const cmdSpans = document.querySelectorAll(".ctrlOrCmd")
    cmdSpans.forEach((span) => {
      span.textContent = "Command"
    })
    const controlSpans = document.querySelectorAll(".ctrlOrControl")
    controlSpans.forEach((span) => {
      span.textContent = "Control"
    })
  }

  // handle video tags
  const videos = Array.from(document.querySelectorAll("video"))

  // set play pause btn click handler
  document.getElementById("playPauseBtn").addEventListener("click", (e) => {
    toggleAllPlayPause(videos)
  })
  // toggle all at space key
  document.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      // prevent scrolling down
      e.preventDefault()

      // if video tag is not focused
      if (!Array.from(videos).includes(document.activeElement)) {
        toggleAllPlayPause(videos)
      }
    }
  })
})

function toggleAllPlayPause(videos) {
  const atLeastOneIsPlaying = !videos.every((v) => v.paused)
  if (atLeastOneIsPlaying) {
    videos.forEach((v) => {
      if (!v.paused) v.pause()
    })
  } else {
    videos.forEach((v) => {
      if (v.paused) v.play()
    })
  }
}
