import { test, expect } from '../fixtures/iDoklad/authFixtures'
import loginData from '../fixtures/iDoklad/login.json'

// npx playwright codegen https://app.idoklad.cz/Account/Login - debug selectors

test('Login with valid credentials and block Clarity requests', async ({ login, page }) => {
  await page.route('https://www.clarity.ms/**', (route) => {
    route.fulfill({
      status: 403,
      body: '',
    })
  })

  // Login
  const response = await login(loginData.email, loginData.password)
  expect(response.ok()).toBeTruthy()

  // Close tip dialog
  await page.locator('.dialog-buttons > div > button').click()
})
