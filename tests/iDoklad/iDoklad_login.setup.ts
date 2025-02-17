import { test as setup, expect } from '../../fixtures/iDoklad/generalFixtures'
import loginData from '../../fixtures/iDoklad/login.json'

setup('authenticate', async ({ page, getByDataUiId }) => {
  await page.goto('https://app.idoklad.cz/Account/Login', { waitUntil: 'load' })

  const emailField = getByDataUiId('csw-username')
  const passwordField = getByDataUiId('csw-password')
  const loginButton = getByDataUiId('csw-login-button')

  await emailField.waitFor({ state: 'visible' })
  await passwordField.waitFor({ state: 'visible' })
  await loginButton.waitFor({ state: 'visible' })

  await emailField.fill(loginData.email)
  await passwordField.fill(loginData.password)

  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/api/Billing/GetDashboardSubscription') && response.status() === 200
  )

  await loginButton.click()
  await responsePromise

  // Close tip dialog
  await page.locator('.dialog-buttons > div > button').click()
  
  await page.context().storageState({ path: ".auth/login.json" })
})