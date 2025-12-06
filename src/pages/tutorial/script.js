import { userIsMac } from "../options/command"

document.addEventListener("DOMContentLoaded", () => {
  // change representation for mac
  const isMac = userIsMac()
  // const isMac = true
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
  const videos = document.querySelectorAll("video")

  // set handlers so that every video tags toggle together
  videos.forEach((v) => {
    v.addEventListener("play", () => {
      videos.forEach((other) => {
        if (other !== v) other.play()
      })
    })

    v.addEventListener("pause", () => {
      videos.forEach((other) => {
        if (other !== v) other.pause()
      })
    })
  })

  // set play pause btn click handler
  document.getElementById("playPauseBtn").addEventListener("click", (e) => {
    const firstVideo = videos[0]
    if (firstVideo.paused) {
      firstVideo.play()
    } else {
      firstVideo.pause()
    }
  })
  // toggle all at space key
  document.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      // prevent scrolling down
      e.preventDefault()

      // if video tag is not focused
      if (!Array.from(videos).includes(document.activeElement)) {
        // toggle all triggering handler above
        if (videos[0].paused) {
          videos[0].play()
        } else {
          videos[0].pause()
        }
      }
    }
  })
})
