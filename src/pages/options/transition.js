// implement small custom transition using animate(), similar to how "svelte" framework's transition works
// all transitions are based on inline display: none; property
const fps = 60

export async function transitionToggle(
  node,
  transitions,
  { delay = 0, duration = 1000, easing = linear },
) {
  const display = getComputedStyle(node).display
  if (__DEV) log("[display before]", display)

  if (display === "none") {
    return transitionIn(node, transitions, { delay, duration, easing })
  } else {
    return transitionOut(node, transitions, { delay, duration, easing })
  }
}

export async function transitionIn(
  node,
  transitions,
  { delay = 0, duration = 1000, easing = linear },
) {
  // create keyframes
  let keyframes = []
  const keyframeCount = Math.ceil(duration / fps)
  for (let keyframeIdx = 0; keyframeIdx <= keyframeCount; keyframeIdx++) {
    const normalizedTime = keyframeIdx / keyframeCount
    // normalized time with easing applied
    const currentProgress = easing(normalizedTime)

    // create keyframe and push
    if (typeof transitions === "function") {
      keyframes.push(transitions(currentProgress))
    } else if (Array.isArray(transitions)) {
      const combinedKeyframe = {}
      // calculate from each transition function
      // so order matters if there is same property.
      for (const transition of transitions) {
        const transitionKeyframe = transition(currentProgress)
        // add each css property to combined keyframe
        for (const cssProperty in transitionKeyframe) {
          combinedKeyframe[cssProperty] = transitionKeyframe[cssProperty]
        }
      }
      keyframes.push(combinedKeyframe)
    }
  }
  if (__DEV) log(`[transitionIn keyframes]`, keyframes)

  // remove inline display none
  node.style.display = ""

  // trigger reflow
  void node.offsetWidth

  // delay
  const delayAnimation = node.animate([], {
    duration: delay,
    fill: "forwards",
  })
  await delayAnimation.finished
  // animate
  const animation = node.animate(keyframes, { duration, fill: "forwards" })
  await animation.finished
}

export async function transitionOut(
  node,
  transitions,
  { delay = 0, duration = 1000, easing = linear },
) {
  // create keyframes
  let keyframes = []
  const keyframeCount = Math.ceil(duration / fps)
  for (let keyframeIdx = 0; keyframeIdx <= keyframeCount; keyframeIdx++) {
    const normalizedTime = keyframeIdx / keyframeCount
    // normalized time with easing applied
    const currentProgress = easing(normalizedTime)

    // create keyframe and push
    if (typeof transitions === "function") {
      keyframes.push(transitions(currentProgress))
    } else if (Array.isArray(transitions)) {
      const combinedKeyframe = {}
      // calculate from each transition function
      // so order matters if there is same property.
      for (const transition of transitions) {
        const transitionKeyframe = transition(currentProgress)
        // add each css property to combined keyframe
        for (const cssProperty in transitionKeyframe) {
          combinedKeyframe[cssProperty] = transitionKeyframe[cssProperty]
        }
      }
      keyframes.push(combinedKeyframe)
    }
  }
  // reverse keyframes
  keyframes = keyframes.reverse()

  if (__DEV) log(`[transitionOut keyframes]`, keyframes)

  // delay
  const delayAnimation = node.animate([], {
    duration: delay,
    fill: "forwards",
  })
  await delayAnimation.finished
  // animate
  const animation = node.animate(keyframes, { duration, fill: "forwards" })
  await animation.finished
  // set inline display none
  node.style.display = "none"
}

// transition keyframe function factories

export function fade({ opacityStart = 0, opacityEnd = 1 } = {}) {
  return (progress) => ({
    opacity: opacityStart + (opacityEnd - opacityStart) * progress,
  })
}

export function scale({ scaleStart = 0, scaleEnd = 1 } = {}) {
  return (progress) => ({
    transform: `scale(${scaleStart + (scaleEnd - scaleStart) * progress})`,
  })
}

export function fly({ xStart = 0, xEnd = 0, yStart = 0, yEnd = 0 } = {}) {
  return (progress) => ({
    transform: `translateX(${xStart + (xEnd - xStart) * progress}px) translateY(${yStart + (yEnd - yStart) * progress}px)`,
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
