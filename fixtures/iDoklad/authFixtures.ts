import { test as generalTest } from './generalFixtures'

export const test = generalTest.extend({
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
    };

    await use(login)
  },
})

export const expect = test.expect
