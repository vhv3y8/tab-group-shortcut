const videos = document.querySelectorAll("video")

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
