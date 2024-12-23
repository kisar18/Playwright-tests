import { test, expect } from "@playwright/test";
import domData from '../fixtures/bookingFixtures.json';

test("Booking search accomodation", async ({ page }) => {
  await page.goto(domData.bookingUrl);

  page.on('console', (msg) => {
    console.log(msg);
  });

  // Decline cookies
  await page.locator("#onetrust-reject-all-handler").click();

  // Title check
  await expect(page).toHaveTitle(domData.title);

  const destinationField = page.getByTestId('destination-container').locator('[name="ss"]')
  await expect(destinationField).toBeVisible()
  await destinationField.fill(domData.destination)

  const startDate = page.getByTestId('date-display-field-start')
  await expect(startDate).toBeVisible()
  await startDate.click()

  // Choosing start date and end date of the trip
  const today = page.locator('span[tabindex="0"]')
  await today.click()
  const todayDate = await today.getAttribute('data-date');
  if (todayDate) {
    const originalDate = new Date(todayDate)
    const newDate = new Date(originalDate)
    newDate.setDate(originalDate.getDate() + domData.tripDays)
    const leavingDate = page.locator(`span[data-date="${newDate.toISOString().split('T')[0]}"]`)
    await leavingDate.click()
  }
  else {
    console.log('Attribute data-date is null or not found')
  }

  const searchButton = page.locator('button[type="submit"]')
  await expect(searchButton).toBeVisible()
  await searchButton.click()
  await expect(page).toHaveTitle(new RegExp(domData.destination))
  const results = page.locator('div[data-results-container="1"]')
  await expect(results).toBeVisible()
})