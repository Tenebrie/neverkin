import { expect, test } from '@playwright/test'

import { makeUrl } from './utils'

test.describe('Guest user', () => {
	test('user is redirected to login page', async ({ page }) => {
		await page.goto(makeUrl('/'))

		await expect(page).toHaveTitle(/Neverkin/)
		await expect(page.getByText('Sign in to Neverkin')).toBeVisible()
	})

	test('does not initiate live connection', async ({ page }) => {
		let socketRequestFound = false

		page.on('websocket', (socket) => {
			if (!socketRequestFound) {
				const url = new URL(socket.url())
				socketRequestFound = url.pathname.startsWith('/live')
			}
		})

		await page.goto(makeUrl('/'))

		await new Promise((resolve) => setTimeout(resolve, 2000))
		expect(socketRequestFound).toBeFalsy()
	})

	test('is able to log in as guest', async ({ page }) => {
		await page.goto(makeUrl('/'))

		await page.getByText('Login as a guest').click()

		await page.goto(makeUrl('/world'))

		await page.getByLabel('Create new world').click()
		await page.getByLabel('Name').fill('Guest world')
		await page.getByText('Create', { exact: true }).click()

		await expect(page.getByLabel('Load world "Guest world"')).toBeVisible()

		await page.getByTestId('UserDropdownButton').click()
		await page.getByText('Security', { exact: true }).click()
		await page.getByText('Delete account').click()
		await page.getByTestId('DeleteAccountConfirmationInput').getByRole('textbox').fill('DELETE')
		await page.getByText('Delete my account').click()

		await page.waitForURL(makeUrl('/login').replace(':80', ''))
		expect(page.getByText("It seems you've already logged in.")).not.toBeVisible()
	})
})
