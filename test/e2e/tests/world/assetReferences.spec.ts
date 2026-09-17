import { createNewUser, deleteAccount } from '@fixtures/auth'
import { closeModal, createWorld, navigateToMindmap, navigateToWikiArticle } from '@fixtures/world'
import { expect, Page, test } from '@playwright/test'
import { makeUrl } from '@tests/utils'

const TINY_PNG_BASE64 =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

test.describe('Asset references', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	// A content save on one entity must never clear the references held by another. When it does,
	// the affected images read as orphaned and the cleanup sweep deletes them from the bucket.
	test('a mindmap node lifecycle leaves an article image referenced', async ({ page }) => {
		const world = await createWorld(page)

		// --- Embed an image in an article, which is what holds the reference ---
		await navigateToWikiArticle(page, world, 'createArticle')
		const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
		await expect(textbox).toBeVisible()
		await textbox.click()
		await pasteImage(page)

		const image = page.locator('img[data-asset-id]')
		await expect(image).toBeAttached({ timeout: 15000 })
		const assetId = (await image.getAttribute('data-asset-id'))!

		// The reference row lands when Calliope flushes the article, so poll Rhea rather than the browser
		await expect.poll(async () => referenceCount(page, assetId), { timeout: 20000 }).toBeGreaterThan(0)

		// --- Quick create a plain node, unrelated to the article and holding no assets of its own ---
		await navigateToMindmap(page, world)
		const grid = page.getByTestId('MindmapGrid')
		const gridBox = await grid.boundingBox()
		expect(gridBox).toBeTruthy()

		const createNodeRequest = page.waitForRequest(
			(req) => req.method() === 'POST' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes/),
		)
		await page.mouse.move(gridBox!.x + gridBox!.width / 2, gridBox!.y + gridBox!.height / 2)
		await page.keyboard.press(' ')
		await page.keyboard.type('Quick draft')
		await page.getByRole('menuitem').filter({ hasText: 'Node:' }).click()
		await createNodeRequest

		const node = page.getByTestId('MindmapNode')
		await expect(node).toHaveCount(1)
		const nodeId = (await node.getAttribute('data-mindmap-node'))!

		// --- Write content on the node, which is the save that used to clear every other reference ---
		await node.getByText('Quick draft').dblclick()
		const editor = page.locator('.ProseMirror').first()
		await expect(editor).toBeVisible()
		await editor.click()
		await page.keyboard.type('Placeholder body text.')

		// Wait for the save to reach Rhea, otherwise the assertion below can win the race
		await expect
			.poll(
				async () => {
					const response = await page.request.get(makeUrl(`/api/world/${world.id}/node/${nodeId}/content`))
					if (!response.ok()) {
						return ''
					}
					return (await response.json()).contentHtml as string
				},
				{ timeout: 20000 },
			)
			.toContain('Placeholder body text.')

		expect(await referenceCount(page, assetId)).toBeGreaterThan(0)

		// --- Deleting the node takes its own content, and nothing belonging to the article ---
		// Opening the editor selected the node, and clicking it again would toggle that back off
		await closeModal(page)
		await expect(node).toHaveAttribute('data-selected', 'true')

		const deleteNodeRequest = page.waitForRequest(
			(req) => req.method() === 'DELETE' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes/),
		)
		await page.keyboard.press('Delete')
		await deleteNodeRequest
		await expect(node).toHaveCount(0)

		expect(await referenceCount(page, assetId)).toBeGreaterThan(0)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})

async function pasteImage(page: Page) {
	await page.evaluate((base64) => {
		const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
		const file = new File([bytes], 'test-image.png', { type: 'image/png' })
		const dataTransfer = new DataTransfer()
		dataTransfer.items.add(file)
		const event = new ClipboardEvent('paste', {
			clipboardData: dataTransfer,
			bubbles: true,
			cancelable: true,
		})
		Object.defineProperty(event, 'clipboardData', { value: dataTransfer })
		document.querySelector('[data-testid="RichTextEditor"] .ProseMirror')?.dispatchEvent(event)
	}, TINY_PNG_BASE64)
}

async function referenceCount(page: Page, assetId: string) {
	const response = await page.request.get(makeUrl('/api/assets?limit=100'))
	if (!response.ok()) {
		return 0
	}
	const body = (await response.json()) as { assets: { id: string; _count: { references: number } }[] }
	return body.assets.find((asset) => asset.id === assetId)?._count.references ?? 0
}
