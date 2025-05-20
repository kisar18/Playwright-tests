import { test, expect } from "@playwright/test"
import domData from '../fixtures/ryanairFixtures.json'
import { createTempEmail, waitForEmail } from "./helpers/emailUtils"

test("TC_02_01 - Sign-up", async ({ page }) => {
  await page.goto(domData.ryanairUrl)

  // Decline cookies
  await page.getByRole("button", { name: domData.declineCookies }).click()

  // Title check
  await expect(page).toHaveTitle(domData.title)

  await page.getByRole("button", { name: domData.loginBtn }).click()

  // Open sign-up window
  const iframe = page.frameLocator('iframe[data-ref="kyc-iframe"]')
  await iframe.locator('button[data-ref="signup_login_signup"]').click()
  const createAccountBtn = iframe.getByRole('button', { name: domData.createAccountBtn })
  await expect(createAccountBtn).toBeVisible()
  
  // Check empty fields
  const emailValidation = iframe.locator('ry-input-d[name="email"] > span').first()
  const passwordValidation = iframe.locator('ry-input-d[name="password"] > span').first()
  await createAccountBtn.click()
  await expect(emailValidation).toBeVisible()
  await expect(emailValidation).toHaveText(domData.requiredEmail)
  await expect(passwordValidation).toBeVisible()
  await expect(passwordValidation).toHaveText(domData.requiredPassword)

  // Email validation
  const emailField = iframe.locator('input[name="email"]')
  await emailField.fill("email")
  await createAccountBtn.click()
  await expect(emailValidation).toBeVisible()
  await expect(emailValidation).toHaveText(domData.invalidEmail)

  await emailField.fill("email@email")
  await createAccountBtn.click()
  await expect(emailValidation).toBeVisible()
  await expect(emailValidation).toHaveText(domData.invalidEmail)

  await emailField.fill("email.email")
  await createAccountBtn.click()
  await expect(emailValidation).toBeVisible()
  await expect(emailValidation).toHaveText(domData.invalidEmail)

  await emailField.fill("Ema1l@l1amE.com")
  await createAccountBtn.click()
  await expect(emailValidation).not.toBeVisible()

  // Password validation
  const passwordField = iframe.locator('input[name="password"]')
  await passwordField.fill("passwd")
  await createAccountBtn.click()
  await expect(passwordValidation).not.toBeVisible()

  // Password requirements
  const oneNumberValidation = iframe.locator('ry-auth-password-validation > :nth-child(3) > :nth-child(1) > :nth-child(1)')
  const eightCharactersValidation = iframe.locator('ry-auth-password-validation > :nth-child(4) > :nth-child(1) > :nth-child(1)')
  const oneSmallLetterValidation = iframe.locator('ry-auth-password-validation > :nth-child(5) > :nth-child(1) > :nth-child(1)')
  const oneBigLetterValidation = iframe.locator('ry-auth-password-validation > :nth-child(6) > :nth-child(1) > :nth-child(1)')

  await expect(oneNumberValidation).toHaveClass('icon--error')
  await expect(eightCharactersValidation).toHaveClass('icon--error')
  await expect(oneSmallLetterValidation).toHaveClass('icon--success')
  await expect(oneBigLetterValidation).toHaveClass('icon--error')

  // Create temp email and fill form
  const { address, token } = await createTempEmail()
  console.log(`Using email: ${address}`)

  await emailField.fill(address)
  await passwordField.fill("TestPassw0rd")
  await createAccountBtn.click({ force: true })

  const email = await waitForEmail(token);
  const content = email.text || email.html;

  if (!content) throw new Error('E-mail does not contain any HTML')

  const codeRegex = /Your eight-digit security code is:\s*(\d{8})/i
  const match = content.match(codeRegex)

  if (!match || !match[1]) throw new Error('Verification code was not found in the e-mail')

  const verificationCode = match[1]
  console.log(`Verification code: ${verificationCode}`)

  // Locate the iframe for email verification
  const iframeLocator = page.locator('iframe[data-ref="kyc-iframe"]')
  await expect(iframeLocator).toBeVisible({ timeout: 10000 })

  // Locate the input field and fill the verification code
  const codeField = page.locator('iframe').contentFrame().getByRole('textbox')
  await expect(codeField).toBeVisible()
  await codeField.fill(verificationCode)

  // Locate the continue button and click it
  const continueButton = page.locator('iframe').contentFrame().getByRole('button', { name: domData.continueBtn })
  await expect(continueButton).toBeVisible()
  await continueButton.click()

  // Check that the profile section header is visible after verification
  const logoutBtn = page.getByRole('button', { name: domData.logoutBtn })
  await expect(logoutBtn).toBeVisible()
})
