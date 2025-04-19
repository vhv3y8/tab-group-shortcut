import { test } from "./utils"

test("Test popup", async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)
  // Test popup UI
})
