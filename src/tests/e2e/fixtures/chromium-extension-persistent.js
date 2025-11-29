import { test as base, chromium } from "@playwright/test"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const extensionFolder = path.join(
  fileURLToPath(import.meta.url),
  "../../../../..",
  "dist2",
)
export const userDataDir = "./.profiles/chromium-profile"

console.log("[extensionFolder]", extensionFolder)

export const commonChromeExtensionTest = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${extensionFolder}`,
        `--load-extension=${extensionFolder}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionSW: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker)
      serviceWorker = await context.waitForEvent("serviceworker")

    await use(serviceWorker)
  },
  extensionId: async ({ extensionSW }, use) => {
    const extensionId = extensionSW.url().split("/")[2]
    await use(extensionId)
  },
})

export const test = commonChromeExtensionTest
export const expect = test.expect
