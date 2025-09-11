import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test.beforeAll(async ({ browser }, _testInfo) => {
    const context = await browser.newContext()
    void (await context.newPage())
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Payload Blank Template/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Welcome to Workout App')
  })
})
