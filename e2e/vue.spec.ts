import { test, expect } from '@playwright/test'

// Needs only the dev server: API failures show up as error states, the layout still renders.
test('home page shows the header and sections', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /GReSym/ }).first()).toBeVisible()
  await expect(page.getByRole('search').first()).toBeVisible()
})

test('protected pages redirect guests to login', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})
