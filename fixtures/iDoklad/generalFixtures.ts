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

  login: async ({ page, getByDataUiId }, use) => {
    const login = async (email, password) => {
      await page.goto('https://app.idoklad.cz/Account/Login', { waitUntil: 'load' })

      const emailField = getByDataUiId('csw-username')
      const passwordField = getByDataUiId('csw-password')
      const loginButton = getByDataUiId('csw-login-button')

      await emailField.waitFor({ state: 'visible' })
      await passwordField.waitFor({ state: 'visible' })
      await loginButton.waitFor({ state: 'visible' })

      await emailField.fill(email)
      await passwordField.fill(password)

      await page.route('**/api/Billing/GetDashboardSubscription', (route) => route.continue())
      const [response] = await Promise.all([
        page.waitForResponse('**/api/Billing/GetDashboardSubscription'),
        loginButton.click(),
      ])
      return response
    }

    await use(login)
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
      const toastMessage = getByDataUiId('csw-toast-message')
      await expect(toastMessage).toBeVisible()
      await expect(toastMessage).toContainText(contact.name)
    })
  },
})

export const expect = test.expect