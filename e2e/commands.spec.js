import { test } from "./utils"

test("Test content script", async ({ page }) => {
  await page.goto("https://example.com") // Your target page
  // Test content script functionality
})
