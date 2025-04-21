/**
 * Helper function to merge storage object on extension update.
 * @param {object} defaults
 * @param {object} current
 * @returns {object}
 */
export function mergeDeep(defaults, current) {
  const result = { ...defaults }
  for (const key in current) {
    if (
      current[key] &&
      typeof current[key] === "object" &&
      !Array.isArray(current[key])
    ) {
      result[key] = mergeDeep(defaults[key] || {}, current[key])
    } else {
      result[key] = current[key]
    }
  }
  return result
}

/**
 * Helper function to update storage object property name.
 * @param {object} obj
 * @param {string} oldPath
 * @param {string} newPath
 * @param {(v: any) => any} transform
 * @returns
 */
export function renameProperty(obj, oldPath, newPath, transform = (v) => v) {
  const oldParts = oldPath.split(".")
  const newParts = newPath.split(".")

  // Get value from old path
  let value = obj
  for (const part of oldParts) {
    if (value?.hasOwnProperty(part)) {
      value = value[part]
    } else {
      return // Old path doesn't exist
    }
  }

  // Delete old path
  let oldParent = obj
  for (let i = 0; i < oldParts.length - 1; i++) {
    oldParent = oldParent[oldParts[i]]
  }
  delete oldParent[oldParts[oldParts.length - 1]]

  // Apply transformation
  const transformedValue = transform(value)

  // Set new path
  let newParent = obj
  for (let i = 0; i < newParts.length - 1; i++) {
    const part = newParts[i]
    if (!newParent[part] || typeof newParent[part] !== "object") {
      newParent[part] = {}
    }
    newParent = newParent[part]
  }
  newParent[newParts[newParts.length - 1]] = transformedValue

  if (import.meta.env.MODE === "development") {
    console.log(`[renameProperty] from ${oldPath}: `, value)
    console.log(`[renameProperty] to ${newPath}: `, transformedValue)
  }
}

/**
 * Get "settings" value from sync storage.
 * @returns {Promise<object>}
 */
export async function getSettings() {
  return chrome.storage.sync.get(["settings"]).then((db) => db.settings)
}
