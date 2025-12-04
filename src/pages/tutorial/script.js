function userIsMac() {
  if (navigator.userAgent) {
    return navigator.userAgent.toUpperCase().includes("MAC")
  } else {
    return navigator.platform.toUpperCase().includes("MAC")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // change representation for mac
  if (userIsMac()) {
    const cmdSpans = document.querySelectorAll(".ctrlOrCmd")
    cmdSpans.forEach((span) => {
      span.textContent = "Cmd"
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

  // toggle all at enter key
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
