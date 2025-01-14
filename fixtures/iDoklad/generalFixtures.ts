import { test as baseTest } from '@playwright/test'

export const test = baseTest.extend({
  getByDataUiId: async ({ page }, use) => {
    const getByDataUiId = (data_ui_id) => page.locator(`[data-ui-id="${data_ui_id}"]`)
        await use(getByDataUiId)
    },
})

export const expect = test.expect