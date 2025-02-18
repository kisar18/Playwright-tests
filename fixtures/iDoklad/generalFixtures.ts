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

  addEmptyContact: async ({ page, getByDataUiId }, use) => {
    await use(async (contact: Contact) => {
      await getByDataUiId('csw-new-item').click()
      const createContactButton = getByDataUiId('csw-new-item-contact');
      await expect(createContactButton).toBeVisible()
      await createContactButton.click()
      const sectionTitle = page.locator('.heading-wrapper h1')
      await expect(sectionTitle).toBeVisible()
      await expect(sectionTitle).toHaveText('Nový kontakt')

      const companyNameInput = page.locator('[name="CompanyName"]')
      await expect(companyNameInput).toBeVisible()
      await companyNameInput.fill(contact.name)

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
  }
})

export const expect = test.expect