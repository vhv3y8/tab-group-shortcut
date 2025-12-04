// implement small custom transition using animate(), similar to how "svelte" framework's transition works
// all transitions are based on inline display: none; property
const fps = 60

export function transitionToggle(
  node,
  transition,
  { delay = 0, duration = 1000, easing = linear },
) {
  const display = getComputedStyle(node).display
  if (__DEV) log("[display before]", display)

  if (display === "none") {
    transitionIn(node, transition, { delay, duration, easing })
  } else {
    transitionOut(node, transition, { delay, duration, easing })
  }
}

export function transitionIn(
  node,
  transition,
  { delay = 0, duration = 1000, easing = linear },
) {
  // create keyframes
  let keyframes = []
  const keyframeCount = Math.ceil(duration / fps)
  for (const keyframeIdx = 0; keyframeIdx <= keyframeCount; keyframeIdx++) {
    const normalizedTime = keyframeIdx / keyframeCount
    // normalized time with easing applied
    const currentProgress = easing(normalizedTime)
    // create keyframe and push
    keyframes.push(transition(currentProgress))
  }

  // remove inline display none
  node.style.display = ""
  node.style.opacity = 0

  // trigger reflow
  void node.offsetWidth

  // delay
  const delayAnimation = node.animate([], { duration: delay, fill: "forwards" })
  delayAnimation.onfinish = () => {
    // animate
    node.animate(keyframes, { duration, fill: "forwards" })
  }
}

// animate() applies keyframes "backwards" here, so transition values should be same as transition in.
// this allows to use same transition function at both in and out.
export function transitionOut(
  node,
  transition,
  { delay = 0, duration = 1000, easing = linear },
) {
  // create keyframes
  let keyframes = []
  const keyframeCount = Math.ceil(duration / fps)
  for (const keyframeIdx = 0; keyframeIdx <= keyframeCount; keyframeIdx++) {
    const normalizedTime = keyframeIdx / keyframeCount
    // normalized time with easing applied
    const currentProgress = easing(normalizedTime)
    // create keyframe and push
    keyframes.push(transition(currentProgress))
  }

  // delay
  const delayAnimation = node.animate([], { duration: delay, fill: "forwards" })
  delayAnimation.onfinish = () => {
    // animate
    const animation = node.animate(keyframes, { duration, fill: "backwards" })
    animation.onfinish = () => {
      // set inline display none
      node.style.display = "none"
    }
  }
}

// transition factories

export function fade({ opacityStart = 0, opacityEnd = 1 }) {
  return (progress) => ({
    opacity: opacityStart + (opacityEnd - opacityStart) * progress,
  })
}

export function scale({ scaleStart = 0, scaleEnd = 1 }) {
  return (progress) => ({
    transform: `scale(${scaleStart + (scaleEnd - scaleStart) * progress})`,
  })
}

// easing functions
// input & output is 0-1 range

export function linear(x) {
  return x
}

export function easeInCubic(x) {
  return x * x * x
}

export function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3)
}

// Development Only stuff, tree shaked at production
// check vite-build.js config for define.__DEV

function log(...anything) {
  console.log(`[tab group shortcut: transition]`, ...anything)
}
