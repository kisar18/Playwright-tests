import { test, expect } from "@playwright/test"
import domData from '../fixtures/vseNaStolniTenis/domData.json'
import languages from '../fixtures/vseNaStolniTenis/languages.json'
import tables from '../fixtures/vseNaStolniTenis/tables.json'

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.vsenastolnitenis.cz/')

  // Decline cookies
  await page.locator('#consentNone').click()
})

test("Sorting tables by price", async ({ page }) => {

  // Tables
  const loadCategoryTime = page.waitForResponse('**/api/v1/widget/translations/lang/**')
  await page.locator('#catmenu1', { hasText: domData.categories[1] }).click()
  await loadCategoryTime

  // Ascending sorting
  const sortByPriceAsc = page.locator('[class="product_price asc"]')
  await expect(sortByPriceAsc).toBeVisible()
  await sortByPriceAsc.click()
  const ascPrices = await page.locator('.pp-cat-item > a > .pp-pbody > .pp-pricebox > .price').allTextContents()

  // Choose first 5 elements
  const parsedAscPrices = ascPrices.slice(0, 5).map(price => parseFloat(price.replace(/\s?kč/i, '').replace(/\./g, '').replace(',', '.')))

  // Verify that the prices are sorted ascending
  const sortedAscPrices = [...parsedAscPrices].sort((a, b) => a - b)
  expect(parsedAscPrices).toEqual(sortedAscPrices)

  // Seřazení podle ceny sestupně
  const sortByPriceDesc = page.locator('[class="product_price desc"]')
  await expect(sortByPriceDesc).toBeVisible()
  await sortByPriceDesc.click()

  // Descending sorting
  const descPrices = await page.locator('.pp-cat-item > a > .pp-pbody > .pp-pricebox > .price').allTextContents()

  // Choose first 5 elements
  const parsedDescPrices = descPrices.slice(0, 5).map(price => parseFloat(price.replace(/\s?kč/i, '').replace(/\./g, '').replace(',', '.')))

  // Verify that the prices are sorted descending
  const sortedDescPrices = [...parsedDescPrices].sort((a, b) => b - a)
  expect(parsedDescPrices).toEqual(sortedDescPrices)
})

test('Filter tables by brand', async ({ page }) => {
  
  // Tables
  const loadCategoryTime = page.waitForResponse('**/api/v1/widget/translations/lang/**')
  await page.locator('#catmenu1', { hasText: domData.categories[1] }).click()
  await loadCategoryTime

  const firstBrand = page.locator('div[data-name="znacka"] > div > ul > li', { hasText: tables[0].brand })
  await expect(firstBrand).toBeVisible()
  await firstBrand.click()

  const productTitles = await page.locator('.pp-cat-item > a > .pp-pbody > .pp-titlebox').allTextContents()
  productTitles.forEach(title => expect(title).toContain(tables[0].brand))
})

test('Check contact info of all stores', async ({ page }) => {

  // Go to contacts page
  const loadCategoryTime = page.waitForResponse('**/api/v1/widget/translations/lang/**')
  await page.locator('#navBarWithDropdown > ul > li.nav-item', { hasText: domData.headerMenuItems[2] }).click()
  await loadCategoryTime

  // Check the number of stores
  await page.waitForSelector('.pp-blog-item', { state: 'visible' })
  const stores = await page.locator('.pp-blog-item')
  const storeCount = await stores.count()
  expect(storeCount).toBe(6)

  // Check the info of each store
  for (let index = 0; index < storeCount; index++) {
    const store = stores.nth(index)
    await expect(store).toContainText(domData.stores[index].name)
    await expect(store).toContainText(domData.stores[index].city)
    
    const textContent = await store.textContent()
    const cleanedText = textContent?.replace(/\s+/g, ' ').trim()
    expect(cleanedText).toContain(domData.stores[index].openingHours)
  }
})

test('Language translations', async ({ page }) => {

  // Iterate trough all the languages
  for (const language of languages) {

    // Check the URL
    await expect(page).toHaveURL(language.url)

    // Check the title
    await expect(page).toHaveTitle(language.title)

    // Check search field placeholder
    const searchField = page.locator('#desktopsearch > form > input[type="search"]')
    await expect(searchField).toBeVisible()
    await expect(searchField).toHaveAttribute('placeholder', language.searchPlaceholder)

    // Check description of the flag image
    const flag = page.locator('#languageChooser > #flag > img')
    await expect(flag).toBeVisible()
    await expect(flag).toHaveAttribute('alt', language.flagAlt)

    // Change the language
    await flag.click()
    const otherLanguages = page.locator('#languageDropdown > .btn')
    await Promise.all(
      (await otherLanguages.all()).map(async (btn) => await expect(btn).toBeVisible())
    )

    if (language !== languages[languages.length - 1]) {
      const reloadPageTime = page.waitForResponse('**/api/v1/widget/translations/lang/**')
      const nextLanguageButton = otherLanguages.nth(languages.indexOf(language))
      await nextLanguageButton.click()
      await reloadPageTime
    }
  }
})
