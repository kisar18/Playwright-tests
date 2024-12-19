import { test, expect } from "@playwright/test";

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
  await page.getByRole("button", { name: "Ne, děkuji" }).click();

  // Title check
  await expect(page).toHaveTitle(
    "Oficiální internetové stránky Ryanair | Levné lety | Exkluzivní nabídka"
  );

  await page.getByRole("button", { name: " Přihlásit se " }).click();

  // Open sign-up window
  const iframe = page.frameLocator('iframe[data-ref="kyc-iframe"]');
  await iframe.locator('button[data-ref="signup_login_signup"]').click();
  await expect(iframe.locator('text=" Vytvořit účet "')).toBeVisible();

  // Empty fields
  await iframe.locator('button[type="submit"]').click();
  await expect(iframe.locator('text="Je třeba uvést e-mail"')).toBeVisible();
  await expect(iframe.locator('text="Je vyžadováno heslo"')).toBeVisible();

  // Testing email field
  await iframe.locator('input[name="email"]').fill("email");
  await iframe.locator('button[type="submit"]').click();
  await expect(iframe.locator('text="Neplatný formát e-mailové adresy"')).toBeVisible();
  await expect(iframe.locator('text="Je vyžadováno heslo"')).toBeVisible();

  await iframe.locator('input[name="email"]').fill("email@email");
  await iframe.locator('button[type="submit"]').click();
  await expect(iframe.locator('text="Neplatný formát e-mailové adresy"')).toBeVisible();
  await expect(iframe.locator('text="Je vyžadováno heslo"')).toBeVisible();

  await iframe.locator('input[name="email"]').fill("email.email");
  await iframe.locator('button[type="submit"]').click();
  await expect(iframe.locator('text="Neplatný formát e-mailové adresy"')).toBeVisible();
  await expect(iframe.locator('text="Je vyžadováno heslo"')).toBeVisible();

  await iframe.locator('input[name="email"]').fill("Ema1l@l1amE.com");
  await iframe.locator('button[type="submit"]').click();
  await expect(iframe.locator('text="Neplatný formát e-mailové adresy"')).not.toBeVisible();
  await expect(iframe.locator('text="Je vyžadováno heslo"')).toBeVisible();

  // Testing password field
  await iframe.locator('input[name="password"]').fill("passwd");
  await iframe.locator('button[type="submit"]').click();
  await expect(iframe.locator('text="Neplatný formát e-mailové adresy"')).not.toBeVisible();
  await expect(iframe.locator('text="Je vyžadováno heslo"')).not.toBeVisible();

  // Validation for at least one number
  await expect(iframe.locator('ry-auth-password-validation > :nth-child(3) > :nth-child(1) > :nth-child(1)')).toHaveClass('icon--error')
  // Validation for at least 8 characters
  await expect(iframe.locator('ry-auth-password-validation > :nth-child(4) > :nth-child(1) > :nth-child(1)')).toHaveClass('icon--error')
  // Validation for at least one small letter
  await expect(iframe.locator('ry-auth-password-validation > :nth-child(5) > :nth-child(1) > :nth-child(1)')).toHaveClass('icon--success')
  // Validation for at least one big letter
  await expect(iframe.locator('ry-auth-password-validation > :nth-child(6) > :nth-child(1) > :nth-child(1)')).toHaveClass('icon--error')
});
