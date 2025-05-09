import { test as baseTest } from '@playwright/test'

type Contact = {
  country: string,
  name: string,
  identificationNumber: string,
  city: string,
  street: string,
  postalCode: number
}

export const test = baseTest.extend({
  getByDataUiId: async ({ page }, use) => {
    const getByDataUiId = (data_ui_id) => page.locator(`[data-ui-id="${data_ui_id}"]`)
    await use(getByDataUiId)
  },

  addEmptyContact: async ({ page, getByDataUiId, fillField }, use) => {
    await use(async (contact: Contact) => {
      const addMenu = getByDataUiId('csw-new-item')
      await expect(addMenu).toBeVisible()
      await addMenu.click()
      const createContactButton = getByDataUiId('csw-new-item-contact')
      await expect(createContactButton).toBeVisible()
      await createContactButton.click()
      const sectionTitle = page.locator('.heading-wrapper h1')
      await expect(sectionTitle).toBeVisible()
      await expect(sectionTitle).toHaveText('Nový kontakt')

      await fillField('[name="CompanyName"]', contact.name)

      const saveContactButton = getByDataUiId('csw-save-new-contact')
      await expect(saveContactButton).toBeVisible()
      await page.route('**/api/Contact/Create', route => {
        route.continue()
      })
      const saveContactRequest = page.waitForResponse('**/api/Contact/Create')
      await saveContactButton.click()
      await saveContactRequest

      const errorsWrapper = page.locator('.errors-wrapper')
      await expect(errorsWrapper).not.toBeVisible()
      const toastMessages = getByDataUiId('csw-toast-message')
      const toastMessagesTexts = await toastMessages.allTextContents()
      const containsExpectedText = toastMessagesTexts.some(text => text.includes(contact.name))
      expect(containsExpectedText).toBeTruthy()
    })
  },

  fillField: async ({ page }, use) => {
    await use(async (selector: string, value: string) => {
      const field = page.locator(selector)
      await expect(field).toBeVisible()
      await field.fill(value)
    })
  }
})

export const expect = test.expect