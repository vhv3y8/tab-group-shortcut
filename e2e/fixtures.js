import { test as base, chromium } from "@playwright/test"
import path from "node:path"

const extensionZipName = `Tab Group Shortcut-1.3.zip`

export const test = base.extend({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, extensionZipName)
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // For manifest v3:
    let [background] = context.serviceWorkers()
    if (!background) background = await context.waitForEvent("serviceworker")

    // For manifest v2:
    // const [background] = context.backgroundPages();
    // if (!background)
    //   background = await context.waitForEvent('backgroundpage');

    const extensionId = background.url().split("/")[2]
    await use(extensionId)
  },
})
