import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "src/tests/e2e",
  globalSetup: "src/tests/e2e/global-setup.js",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
