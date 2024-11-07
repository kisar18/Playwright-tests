import { test, expect } from '@playwright/test';

test('iDoklad sign up', async ({ page }) => {
  await page.goto('https://www.idoklad.cz/');

  // Decline cookies
  await page.getByRole('button', { name: 'Reject all' }).click();

  await page.getByRole('link', { name: 'Vyzkoušejte zdarma' }).click();

  // Title check
  await expect(page).toHaveTitle("Registrace");

  await page.getByRole('button', { name: 'Vstupte zdarma' }).click();

  const lastErrorMessage = page.locator('.errors-wrapper > div[data-ui-id="csw-error-message"]').last();

  // Email tests
  await expect(lastErrorMessage).toHaveText(/E-mailová adresa/);

  await page.locator('[name="Email"]').fill("email");
  await expect(lastErrorMessage).toHaveText(/E-mail/);

  await page.locator('[name="Email"]').fill("email@email");
  await expect(lastErrorMessage).toHaveText(/E-mail/);

  await page.locator('[name="Email"]').fill("email.email");
  await expect(lastErrorMessage).toHaveText(/E-mail/);

  await page.locator('[name="Email"]').fill("email@email.com");
  await expect(lastErrorMessage).not.toHaveText(/E-mail/);

  // Password tests
  await expect(lastErrorMessage).toHaveText(/Heslo/);

  await page.locator('[name="Password"]').fill("passwor");
  await expect(lastErrorMessage).toHaveText(/Heslo/);

  await page.locator('[name="Password"]').fill("password");
  await expect(lastErrorMessage).toHaveText(/Heslo/);

  await page.locator('[name="Password"]').fill("Password");
  await expect(lastErrorMessage).toHaveText(/Heslo/);

  await page.locator('[name="Password"]').fill("Passw0rd");
  await expect(lastErrorMessage).not.toHaveText(/Heslo/);

  // Password confirmation tests
  await expect(lastErrorMessage).toHaveText(/Potvrzení hesla/);

  await page.locator('[name="ConfirmPassword"]').fill("passwor");
  await expect(lastErrorMessage).toHaveText(/Hesla/);

  await page.locator('[name="ConfirmPassword"]').fill("password");
  await expect(lastErrorMessage).toHaveText(/Hesla/);

  await page.locator('[name="ConfirmPassword"]').fill("Password");
  await expect(lastErrorMessage).toHaveText(/Hesla/);

  await page.locator('[name="ConfirmPassword"]').fill("Passw0rd");
  await expect(lastErrorMessage).not.toHaveText(/Hesla/);

  // IČ tests
  await expect(lastErrorMessage).toHaveText(/IČ/);

  await page.locator('[name="IdentificationNumber"]').fill("test");
  await expect(lastErrorMessage).toHaveText(/IČ/);

  await page.locator('[name="IdentificationNumber"]').fill("@&|");
  await expect(lastErrorMessage).toHaveText(/IČ/);

  const checkbox = page.locator('.switch-wrapper input[type="checkbox"]');
  await checkbox.check();
  await expect(lastErrorMessage).not.toBeVisible();

});
