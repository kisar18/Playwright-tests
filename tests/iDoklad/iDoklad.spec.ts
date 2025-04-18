import { test, expect } from '../helpers/generalFixtures'
import contacts from '../../fixtures/iDoklad/contacts.json'
import domData from '../../fixtures/iDoklad/domData.json'
import searchData from '../../fixtures/iDoklad/searchData.json'

// npx playwright codegen https://app.idoklad.cz/Account/Login - debug selectors
// npx playwright test iDoklad.spec.ts --project=chromium --workers=1

test.beforeEach(async ({ page, addEmptyContact }) => {
  await page.goto('https://app.idoklad.cz/')

  await addEmptyContact(contacts[0])
  await addEmptyContact(contacts[3])
  await addEmptyContact(contacts[4])

  const loadHomeRequest = page.waitForResponse('**/api/Dashboard/UnpaidInvoices**')
  await page.locator('[data-ui-id="csw-side-menu-home"]').click()
  await loadHomeRequest
})

test.afterEach(async ({ page }) => {
  // Go to contacts list
  await page.goto('https://app.idoklad.cz/', { timeout: 15000 })

  const loadContactsRequest = page.waitForResponse('**/api/Contact/ReadAjax**')
  await expect(page.locator('[data-ui-id="csw-side-menu-address-book"]')).toBeVisible()
  await page.locator('[data-ui-id="csw-side-menu-address-book"]').click()
  await loadContactsRequest

  // Select all contacts
  await expect(page.locator('thead[role="presentation"] > tr > th > input')).toBeVisible()
  await page.locator('thead[role="presentation"] > tr > th > input').click()

  // Click delete button
  await expect(page.locator('[data-ui-id="csw-grid-delete"] > button')).toBeVisible()
  await page.locator('[data-ui-id="csw-grid-delete"] > button').click()

  // Confirm deletion
  const deleteContactsRequest = page.waitForResponse('**/api/Contact/ReadAjax**')
  await expect(page.locator('[data-ui-id="csw-dialog-confirm"]')).toBeVisible()
  await page.locator('[data-ui-id="csw-dialog-confirm"]').click()
  await deleteContactsRequest
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
  await countrySearch.type(contacts[2].countrySearchValue)

  const targetCountry = page.locator('ul[role="listbox"] li')
  await expect(targetCountry).toHaveCount(1)
  await expect(targetCountry).toContainText(contacts[2].country)
  await targetCountry.click()

  const companyName = page.locator('[name="CompanyName"]')
  await expect(companyName).toBeVisible()
  await companyName.fill(contacts[2].name)

  const identificationNumber = page.locator('[name="IdentificationNumber"]')
  await expect(identificationNumber).toBeVisible()
  await identificationNumber.fill(contacts[2].identificationNumber)

  const saveContactTimePromise = page.waitForResponse('**/api/Contact/Create')
  await saveContact.click()
  await saveContactTimePromise

  await expect(validations).not.toBeVisible()

  const toastMessages = getByDataUiId('csw-toast-message')
  const toastMessagesTexts = await toastMessages.allTextContents()
  const containsExpectedText = toastMessagesTexts.some(text => text.includes(domData.contactAdded))
  expect(containsExpectedText).toBeTruthy()
})

test('Edit the first contact', async ({ page, getByDataUiId }) => {
  // Go to contacts list
  const contactsPageLoad = page.waitForResponse('**/api/Contact/IndexData')
  const sideMenu = await getByDataUiId('csw-side-menu-address-book')
  await expect(sideMenu).toBeVisible()
  await sideMenu.click()
  await contactsPageLoad

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
  const saveContactRequest = page.waitForResponse('**/api/Contact/Update')
  await saveContactButton.click()
  await saveContactRequest

  const errorsWrapper = page.locator('.errors-wrapper')
  await expect(errorsWrapper).not.toBeVisible()

  const toastMessages = getByDataUiId('csw-toast-message')
  const toastMessagesTexts = await toastMessages.allTextContents()
  const containsExpectedText = toastMessagesTexts.some(text => text.includes(domData.contactEdited))
  expect(containsExpectedText).toBeTruthy()
})

test('Delete first contact', async ({ page, getByDataUiId }) => {
  // Go to contacts list
  const contactsPageLoad = page.waitForResponse('**/api/Contact/IndexData')
  const sideMenu = await getByDataUiId('csw-side-menu-address-book')
  await expect(sideMenu).toBeVisible()
  await sideMenu.click()
  await contactsPageLoad

  // Delete contact
  const contactsTable = await page.locator('.k-grid-container > div > div > table[role="presentation"]')
  await expect(contactsTable).toBeVisible()

  const selectedContact = contactsTable.locator('tr').first()
  await expect(selectedContact).toBeVisible()

  const moreActions = selectedContact.locator('[data-ui-id="csw-row-action-show-more-action"]')
  await expect(moreActions).toBeVisible()
  await moreActions.click()

  const deleteContact = await getByDataUiId('csw-row-action-delete')
  await expect(deleteContact).toBeVisible()
  await deleteContact.click()

  const deleteContactTime = page.waitForResponse('**/api/Contact/ReadAjax**')
  const confirmDialog = await getByDataUiId('csw-dialog-confirm')
  await expect(confirmDialog).toBeVisible()
  await confirmDialog.click()
  await deleteContactTime

  const toastMessages = getByDataUiId('csw-toast-message')
  const toastMessagesTexts = await toastMessages.allTextContents()
  const containsExpectedText = toastMessagesTexts.some(text => text.includes(domData.contactDeleted))
  expect(containsExpectedText).toBeTruthy()
})

test('Search contacts', async ({ page, getByDataUiId }) => {
  // Go to contacts list
  const contactsPageLoad = page.waitForResponse('**/api/Contact/IndexData')
  const sideMenu = await getByDataUiId('csw-side-menu-address-book')
  await expect(sideMenu).toBeVisible()
  await sideMenu.click()
  await contactsPageLoad

  const rows = page.locator('tr.k-master-row')
  await rows.first().waitFor({ state: 'visible' })
  let allContactsLength = await page.locator('tr.k-master-row').count()
  console.log(allContactsLength)

  // Searching
  const searchField = await getByDataUiId('csw-grid-search')
  await expect(searchField).toBeVisible()

  const searchTerm = searchData[0].input.toLowerCase()
  const searchRequest = page.waitForResponse('**/api/Contact/ReadAjax**')
  await searchField.fill(searchTerm)
  await searchRequest

  const filteredRows = await page.locator('tr.k-master-row')
  const filteredRowCount = await filteredRows.count()

  expect(filteredRowCount).toBeLessThan(allContactsLength)

  for (let i = 0; i < filteredRowCount; i++) {
    const rowText = await filteredRows.nth(i).innerText()
    expect(rowText.toLowerCase()).toContain(searchTerm)
  }
})

test('Sort contacts', async ({ page, getByDataUiId }) => {
  // Go to contacts list
  const contactsPageLoad = page.waitForResponse('**/api/Contact/IndexData')
  const sideMenu = await getByDataUiId('csw-side-menu-address-book')
  await expect(sideMenu).toBeVisible()
  await sideMenu.click()
  await contactsPageLoad

  // A to Z sorting
  const sortByName = await page.locator('th[aria-colindex="2"]')
  await expect(sortByName).toBeVisible()
  await sortByName.click()

  const contactsAtoZ = await page.locator('tr.k-master-row [data-ui-id="csw-company-name"]').evaluateAll(elements => {
      return elements.map(el => (el.textContent || '').trim())
  })

  const sortedAtoZ = [...contactsAtoZ].sort()
  expect(contactsAtoZ).toEqual(sortedAtoZ)

  // Z to A sorting
  await sortByName.click()

  const contactsZtoA = await page.locator('tr.k-master-row [data-ui-id="csw-company-name"]').evaluateAll(elements => {
      return elements.map(el => (el.textContent || '').trim())
  })

  const sortedZtoA = [...contactsZtoA].sort().reverse()
  expect(contactsZtoA).toEqual(sortedZtoA)
})