import { createNewUser, deleteAccount } from '@fixtures/auth'
import { navigateToDashboard } from '@fixtures/world'
import test, { expect } from '@playwright/test'

test.describe('Live Websocket', () => {
	let userData: Awaited<ReturnType<typeof createNewUser>>
	test.beforeEach(async ({ page }) => {
		userData = await createNewUser(page)
	})

	test('connects to live updates', async ({ page }) => {
		const promise = page.waitForEvent('websocket', (socket) => {
			const url = new URL(socket.url())
			return url.pathname.startsWith('/live')
		})

		await navigateToDashboard(page)

		await expect(promise).resolves.toBeTruthy()
	})

	test('disconnects from live updates after logout and connects when logs back', async ({ page }) => {
		const promise = page.waitForEvent('websocket', (socket) => {
			const url = new URL(socket.url())
			return url.pathname.startsWith('/live')
		})

		await navigateToDashboard(page)

		await promise

		let socketReconnected = false
		page.on('websocket', (socket) => {
			if (!socketReconnected) {
				const url = new URL(socket.url())
				socketReconnected = url.pathname.startsWith('/live')
			}
		})

		await page.getByTestId('UserDropdownButton').click()
		await page.getByText('Logout').click()

		await new Promise((resolve) => setTimeout(resolve, 2000))
		expect(socketReconnected).toBeFalsy()

		await page.getByLabel('Email').fill(userData.email)
		await page.getByLabel('Password').fill(userData.password)

		await page.getByText('Sign In', { exact: true }).click()

		await page.waitForEvent('websocket', (socket) => {
			const url = new URL(socket.url())
			return url.pathname.startsWith('/live')
		})
	})

	test('reconnects to live updates back if socket was closed', async ({ page }) => {
		await page.routeWebSocket(/\/live/, (socket) => {
			socket.connectToServer()
			socket.close()
		})

		await navigateToDashboard(page)

		await page.waitForEvent('websocket', (socket) => {
			const url = new URL(socket.url())
			return url.pathname.startsWith('/live')
		})

		await page.waitForEvent('websocket', (socket) => {
			const url = new URL(socket.url())
			return url.pathname.startsWith('/live')
		})
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
