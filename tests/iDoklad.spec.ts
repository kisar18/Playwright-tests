import { test, expect } from '../fixtures/iDoklad/generalFixtures'
import loginData from '../fixtures/iDoklad/login.json'
import contacts from '../fixtures/iDoklad/contacts.json'
import domData from '../fixtures/iDoklad/domData.json'

// npx playwright codegen https://app.idoklad.cz/Account/Login - debug selectors

test.beforeEach('Login with valid credentials and block Clarity requests', async ({ login, page }) => {
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

test('Create contact', async ({ page, getByDataUiId }) => {

  // Open new contact form
  await getByDataUiId('csw-new-item').click()
  const createContact = await getByDataUiId('csw-new-item-contact')
  await expect(createContact).toBeVisible()
  await createContact.click()

  const sectionTitle = page.locator('.heading-wrapper h1')
  await expect(sectionTitle).toBeVisible()
  await expect(sectionTitle).toHaveText('Nový kontakt')

  const saveContact = getByDataUiId('csw-save-new-contact')
  await expect(saveContact).toBeVisible()
  await saveContact.click()

  const validations = page.locator('.errors-wrapper')
  await expect(validations).toBeVisible()

  const countryButton = page.locator('[name="CountryId"]').locator('..').locator('button')
  await expect(countryButton).toBeVisible()
  await countryButton.click()

  const countrySearch = page.locator('.k-list-filter')
  await expect(countrySearch).toBeVisible()
  await countrySearch.type(contacts[0].countrySearchValue)

  const targetCountry = page.locator('ul[role="listbox"] li')
  await expect(targetCountry).toHaveCount(1)
  await expect(targetCountry).toContainText(contacts[0].country)
  await targetCountry.click()

  const companyName = page.locator('[name="CompanyName"]')
  await expect(companyName).toBeVisible()
  await companyName.fill(contacts[0].name)

  const identificationNumber = page.locator('[name="IdentificationNumber"]')
  await expect(identificationNumber).toBeVisible()
  await identificationNumber.fill(contacts[0].identificationNumber)

  // Check if there is same existing contact
  const checkDupliciteIcoTimePromise = page.waitForResponse(
    '**/api/Contact/CheckEmailDuplicity?contactEmail=&contactIn=' + contacts[0].identificationNumber + '&contactId=0'
  )
  const saveContactTimePromise = page.waitForResponse('**/api/Contact/Create')

  await saveContact.click()
  await checkDupliciteIcoTimePromise

  const btnText = await saveContact.textContent()
  if (btnText.trim() === domData.saveDuplicateContact) {
    // Duplicate contact found
    await saveContact.click()
  }

  await saveContactTimePromise

  await expect(validations).not.toBeVisible()
  const toastMessage = getByDataUiId('csw-toast-message')
  await expect(toastMessage).toBeVisible()
  await expect(toastMessage).toContainText(contacts[0].name)
})

test('Edit the first contact', async ({ page, addEmptyContact, getByDataUiId }) => {
  // Go to contacts list
  await page.route('**/api/Contact/IndexData', route => {
    route.continue()
  })
  const contactsPageLoad = page.waitForResponse('**/api/Contact/IndexData')
  const sideMenu = await getByDataUiId('csw-side-menu-address-book')
  await expect(sideMenu).toBeVisible()
  await sideMenu.click()
  await contactsPageLoad

  // Check if there is atleast one existing contact
  const body = page.locator('body')
  const hasEmptyListButton = await body.locator('button[data-ui-id="csw-empty-list-new-item"]').count()

  if (hasEmptyListButton > 0) {
    await addEmptyContact(contacts[0])
  }

  // Edit contact
  const contactsTable = page.locator('.k-grid-container > div > div > table[role="presentation"]')
  await expect(contactsTable).toBeVisible()
  const selectedContact = contactsTable.locator('tr').first()
  await expect(selectedContact).toBeVisible()

  const editButton = await selectedContact.locator('[data-ui-id="csw-row-action-edit"]')
  await expect(editButton).toBeVisible()
  await editButton.click()

  const countryButton = page.locator('[name="CountryId"]').locator('..').locator('button')
  await expect(countryButton).toBeVisible()
  await countryButton.click()

  const countrySearch = page.locator('.k-list-filter > span > .k-input-inner')
  await expect(countrySearch).toBeVisible()
  await countrySearch.fill(contacts[1].countrySearchValue)

  const targetCountry = page.locator('ul[role="listbox"]').locator('li')
  await expect(targetCountry).toHaveCount(1)
  await expect(targetCountry).toContainText(contacts[1].country)
  await targetCountry.click()


  const fillField = async (selector: string, value: string) => {
    const field = page.locator(selector)
    await expect(field).toBeVisible()
    await field.clear()
    await field.fill(value)
  }

  await fillField('[name="CompanyName"]', contacts[1].name)
  await fillField('[name="IdentificationNumber"]', contacts[1].identificationNumber)
  await fillField('[name="Street"]', contacts[1].street)
  await fillField('[name="PostalCode"]', (contacts[1].postalCode).toString())
  await fillField('[name="City"]', contacts[1].city)

  // Save contact
  const saveContactButton = await getByDataUiId('csw-save-new-contact')
  await expect(saveContactButton).toBeVisible()
  await page.route('**/api/Contact/Update', route => route.continue())
  const saveContactRequest = page.waitForResponse('**/api/Contact/Update')
  await saveContactButton.click()
  await saveContactRequest

  const errorsWrapper = page.locator('.errors-wrapper')
  await expect(errorsWrapper).not.toBeVisible()
  const toastMessage = await getByDataUiId('csw-toast-message')
  await expect(toastMessage).toBeVisible()
  await expect(toastMessage).toContainText(domData.contactEdited)
})