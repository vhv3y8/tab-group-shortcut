export const storageDefault = {
  settings: {
    pageCommand: {
      metaKey: false,
      ctrlKey: true,
      shiftKey: false,
      key: "G",
    },
    openNamingPopup: false,
    enableForceCommand: true,
    openUpdateNotesPageOnExtensionUpdate: true,
    darkmode: false,
  },
}

export async function getStorage() {
  return chrome.storage.sync.get(null)
}

export async function setStorage(storage) {
  return chrome.storage.sync.set(storage)
}

export async function getSettings() {
  return chrome.storage.sync.get(["settings"]).then(({ settings }) => settings)
}

export async function setSettings(settings) {
  return chrome.storage.sync.set({ settings })
}

/** Storage Migration Stuff */

/**
 * Maps for updating storage object property name.
 * Needed for old version users updating.
 */
export const storagePropertyChangeMaps = [
  {
    oldPath: "settings.turnOffForceCommand",
    newPath: "settings.enableForceCommand",
    transform: (v) => !v,
  },
  {
    oldPath: "settings.openHomeOnExtensionUpdate",
    newPath: "settings.openUpdateNotesPageOnExtensionUpdate",
    transform: (v) => v,
  },
]

export async function doStorageMigration() {
  // get existing user storage
  const currentUserStorage = await getStorage()

  // do migration
  let updatedUserStorage = currentUserStorage
  // update changed property names
  for (const { oldPath, newPath, transform } of storagePropertyChangeMaps) {
    renameProperty(updatedUserStorage, oldPath, newPath, transform)
  }
  // deep merge transformed existing user storage into updated extension default storage
  const merged = deepMerge(storageDefault, updatedUserStorage)

  // set migrated storage
  await setStorage(merged)
  // give merged storage to do stuff with it right away
  return merged
}

/**
 * Helper function to merge storage object on extension update.
 * @param {object} defaults
 * @param {object} current
 * @returns {object}
 */
export function deepMerge(defaults, current) {
  const result = { ...defaults }
  for (const key in current) {
    if (
      current[key] &&
      typeof current[key] === "object" &&
      !Array.isArray(current[key])
    ) {
      result[key] = deepMerge(defaults[key] || {}, current[key])
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
