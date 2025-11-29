import { test } from "../../fixtures/chromium-extension-persistent"
import { sleep } from "../../helpers/utils"

test("dummy", async ({ context, page, extensionId }) => {
  await page.goto(
    `chrome-extension://${extensionId}/pages/update_notes/index.html`,
  )
  console.log("hi")

  await sleep(29000)
})
