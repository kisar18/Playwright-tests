import { test, expect } from "@playwright/test";
import domData from '../fixtures/testFixture.json';

/*
  Commands to run the tests:
  npx playwright test (runs all the tests in all the browsers)
  npx playwright test --ui (runs tests in ui mode in all the browsers)
  npx playwright test --project webkit (runs tests in a specific browser)
  npx playwright test ryanairLogin.spec.ts --project chromium (runs a specific test in specific browser)

  Pořešit:
  - Fixtures
  - Aliasy
  - Custom commandy
  - Zjednodušit selektory (cy.find() nebo cy.parent()) ???
*/

test("Ryanair sign-up", async ({ page }) => {
  await page.goto("https://www.ryanair.com/cz/cs");

  // Decline cookies
  await page.getByRole("button", { name: domData.declineCookies }).click();

  // Title check
  await expect(page).toHaveTitle(domData.title);

  await page.getByRole("button", { name: " Přihlásit se " }).click();

  // Open sign-up window
  const iframe = page.frameLocator('iframe[data-ref="kyc-iframe"]');
  await iframe.locator('button[data-ref="signup_login_signup"]').click();
  const createAccountBtn = iframe.locator('text=" Vytvořit účet "')
  await expect(createAccountBtn).toBeVisible();

  // Empty fields
  const emailValidation = iframe.locator('ry-input-d[name="email"] > span').first();
  const passwordValidation = iframe.locator('ry-input-d[name="password"] > span').first();
  await createAccountBtn.click();
  await expect(emailValidation).toBeVisible();
  await expect(emailValidation).toHaveText(domData.requiredEmail);
  await expect(passwordValidation).toBeVisible();
  await expect(passwordValidation).toHaveText(domData.requiredPassword);

  // Testing email field
  const emailField = iframe.locator('input[name="email"]')
  await emailField.fill("email");
  await createAccountBtn.click();
  await expect(emailValidation).toBeVisible();
  await expect(emailValidation).toHaveText(domData.invalidEmail);

  await emailField.fill("email@email");
  await createAccountBtn.click();
  await expect(emailValidation).toBeVisible();
  await expect(emailValidation).toHaveText(domData.invalidEmail);

  await emailField.fill("email.email");
  await createAccountBtn.click();
  await expect(emailValidation).toBeVisible();
  await expect(emailValidation).toHaveText(domData.invalidEmail);

  await emailField.fill("Ema1l@l1amE.com");
  await createAccountBtn.click();
  await expect(emailValidation).not.toBeVisible();

  // Testing password field
  const passwordField = iframe.locator('input[name="password"]')
  await passwordField.fill("passwd")
  await createAccountBtn.click();
  await expect(passwordValidation).not.toBeVisible();

  // Password requirements
  const oneNumberValidation = iframe.locator('ry-auth-password-validation > :nth-child(3) > :nth-child(1) > :nth-child(1)')
  const eightCharactersValidation = iframe.locator('ry-auth-password-validation > :nth-child(4) > :nth-child(1) > :nth-child(1)')
  const oneSmallLetterValidation = iframe.locator('ry-auth-password-validation > :nth-child(5) > :nth-child(1) > :nth-child(1)')
  const oneBigLetterValidation = iframe.locator('ry-auth-password-validation > :nth-child(6) > :nth-child(1) > :nth-child(1)')

  await expect(oneNumberValidation).toHaveClass('icon--error')
  await expect(eightCharactersValidation).toHaveClass('icon--error')
  await expect(oneSmallLetterValidation).toHaveClass('icon--success')
  await expect(oneBigLetterValidation).toHaveClass('icon--error')
});
