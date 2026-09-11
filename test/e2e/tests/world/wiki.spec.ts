import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createWikiArticle, createWikiFolder, createWorld, navigateToWiki } from '@fixtures/world'
import { expect, Locator, Page, test } from '@playwright/test'

test.describe('Wiki View', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('empty state renders correctly', async ({ page }) => {
		await navigateToWiki(page, 'createWorld')
		await expect(page.getByText('Nothing has been created yet!')).toBeVisible()
		await expect(page.getByText('Create new article')).not.toBeVisible()
	})

	test.describe('user flows', () => {
		test('create article -> edit article -> delete article', async ({ page }) => {
			await navigateToWiki(page, 'createWorld')

			// Create article
			await createArticleViaUI(page, 'Testing article')

			// Open article
			await withYjsSocket(page, () => page.getByText('Testing article').click())
			await expect(page.getByTestId('EditableTitle').getByText('Testing article')).toBeVisible()

			// Edit article
			const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
			await expect(textbox).toBeVisible()

			await textbox.fill('This is a test article')
			await withYjsSocket(page, () => page.reload())
			await expect(textbox).toBeVisible()
			await expect(textbox).toHaveText('This is a test article')

			await textbox.selectText()
			await textbox.pressSequentially('The text has been changed', { delay: 10 })
			await withYjsSocket(page, () => page.reload())
			await expect(textbox).toBeVisible()
			await expect(textbox).toHaveText('The text has been changed')

			// Delete article
			await page.getByLabel('Article context menu').click()
			await page.getByRole('menuitem').getByText('Delete').click()
			await expect(page.getByText('Delete article', { exact: true })).toBeVisible()

			await page.getByText('Confirm').click()
			await expect(page.getByText('Nothing has been created yet!')).toBeVisible()
		})

		test('add mention -> switch article -> add mention -> switch back -> mention changes', async ({
			page,
		}) => {
			// Prepare world
			const world = await createWorld(page)
			await createWikiArticle(page, world, { name: 'First article' })
			await createWikiArticle(page, world, { name: 'Second article' })
			await navigateToWiki(page, world)

			// Navigate to article A
			await page.getByText('First article').click()
			const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
			await expect(textbox).toBeVisible()
			await expect(textbox).toHaveText('')

			// Add mention
			await textbox.click()
			await textbox.pressSequentially('Hello @TestActor', { delay: 10 })
			await withCreatedActor(page, () => page.keyboard.press('Enter'))

			// Switch to article B
			await withYjsSocket(page, () => page.getByText('Second article').click())
			await expect(textbox).toHaveText('')

			// Add mention
			await textbox.pressSequentially('Also hi @UnrelatedActor', { delay: 10 })
			await withCreatedActor(page, () => page.keyboard.press('Enter'))

			// Switch back to article A
			await withYjsSocket(page, () => page.getByText('First article').click())
			await expect(textbox).toHaveText('Hello TestActor')

			// Switch back to article B
			await withYjsSocket(page, () =>
				page.getByTestId('ArticleListWithHeader').getByText('Second article').click(),
			)
			await expect(textbox).toHaveText('Also hi UnrelatedActor')
		})

		test('add mentions -> switch article -> switch back -> edit -> mentions stay the same', async ({
			page,
		}) => {
			// Prepare world
			const world = await createWorld(page)
			await createWikiArticle(page, world, { name: 'First article' })
			await createWikiArticle(page, world, { name: 'Second article' })
			await navigateToWiki(page, world)

			// Navigate to article A
			await page.getByText('First article').click()
			const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
			await expect(textbox).toBeVisible()
			await expect(textbox).toHaveText('')
			await page.waitForTimeout(1000)

			// Add mentions
			await textbox.pressSequentially('Hello @TestActor', { delay: 10 })
			await page.keyboard.press('Enter')
			await page.waitForTimeout(1000)
			await textbox.pressSequentially('\nHello @UnrelatedActor', { delay: 10 })
			await page.keyboard.press('Enter')
			await page.waitForTimeout(1000)

			// Switch to article B
			await withYjsSocket(page, () => page.getByText('Second article').click())
			await expect(textbox).toHaveText('')

			// Switch back to article A
			await withYjsSocket(page, () =>
				page.getByTestId('ArticleListWithHeader').getByText('First article').click(),
			)
			await expect(textbox).toHaveText('Hello TestActorHello UnrelatedActor')

			// Edit article
			await textbox.focus()
			await textbox.press('Home')
			await textbox.press('ArrowUp')
			await textbox.press('Enter')
			await expect(textbox).toHaveText('Hello TestActorHello UnrelatedActor')
		})

		test('moving articles into and out of folders', async ({ page }) => {
			// Prepare world
			const world = await createWorld(page)
			await createWikiFolder(page, world, { name: 'Parent folder' })
			await createWikiFolder(page, world, { name: 'Inner folder' })
			await createWikiArticle(page, world, { name: 'First article' })
			await createWikiArticle(page, world, { name: 'Second article' })
			await navigateToWiki(page, world)

			const parentFolder = page.getByTestId('ArticleListItem/Parent folder/0')

			await expect(parentFolder).toHaveAttribute('data-item-type', 'folder')
			await expect(page.getByTestId('ArticleListItem/First article/0')).toHaveAttribute(
				'data-item-type',
				'article',
			)

			// Drop an article onto the bottom half of a folder -> the article moves into it
			await dragEntityIntoFolder(page, page.getByText('First article'), parentFolder)
			await expect(parentFolder.getByTestId('ArticleListItem/First article/1')).toBeVisible()

			// Nest a folder inside a folder
			await dragEntityIntoFolder(page, page.getByText('Inner folder'), parentFolder)
			const innerFolder = parentFolder.getByTestId('ArticleListItem/Inner folder/1')
			await expect(innerFolder).toBeVisible()

			// Move an article into the nested folder
			await dragEntityIntoFolder(page, page.getByText('Second article'), innerFolder)
			await expect(innerFolder.getByTestId('ArticleListItem/Second article/2')).toBeVisible()

			// Move an article back to root by dropping onto the root list
			await dragEntityToRoot(page, page.getByText('First article'))
			await expect(page.getByTestId('ArticleListItem/First article/0')).toBeVisible()
		})

		test('rename folder via context menu', async ({ page }) => {
			// Prepare world
			const world = await createWorld(page)
			await createWikiFolder(page, world, { name: 'Testing folder' })
			await createWikiArticle(page, world, { name: 'Testing article' })
			await navigateToWiki(page, world)

			// Articles do not offer the rename option
			await page.getByTestId('ArticleListItem/Testing article/0').click({ button: 'right' })
			await expect(page.getByRole('menuitem').getByText('Select')).toBeVisible()
			await expect(page.getByRole('menuitem').getByText('Rename')).not.toBeVisible()
			await page.keyboard.press('Escape')

			// Open the rename modal from the folder context menu
			await page.getByTestId('ArticleListItem/Testing folder/0').click({ button: 'right' })
			await page.getByRole('menuitem').getByText('Rename').click()
			await expect(page.getByText('Rename folder', { exact: true })).toBeVisible()

			// The current name is prefilled, focused and fully selected
			const nameInput = page.getByLabel('Name')
			await expect(nameInput).toHaveValue('Testing folder')
			await expect(nameInput).toBeFocused()
			const selection = await nameInput.evaluate((el: HTMLInputElement) => [
				el.selectionStart,
				el.selectionEnd,
			])
			expect(selection).toEqual([0, 'Testing folder'.length])

			// Typing replaces the selected name, Enter confirms
			await page.keyboard.type('Renamed folder', { delay: 10 })
			await expect(nameInput).toHaveValue('Renamed folder')

			const renameRequest = page.waitForResponse(
				(response) => response.request().method() === 'PATCH' && response.url().includes('/wiki/folder/'),
			)
			await page.keyboard.press('Enter')
			expect((await renameRequest).ok()).toBeTruthy()

			await expect(page.getByText('Rename folder', { exact: true })).not.toBeVisible()
			await expect(page.getByTestId('ArticleListItem/Renamed folder/0')).toBeVisible()

			// The rename persists after a reload
			await page.reload()
			await expect(page.getByTestId('ArticleListItem/Renamed folder/0')).toBeVisible()
		})

		test('drop an entity onto another -> it is reordered before or after', async ({ page }) => {
			// Prepare world
			const world = await createWorld(page)
			await createWikiArticle(page, world, { name: 'First article' })
			await createWikiArticle(page, world, { name: 'Second article' })
			await navigateToWiki(page, world)

			// Check that first article appears BEFORE second article
			const list = page.getByTestId('ArticleList/0')
			await expect(list).toBeVisible()

			const items = list.getByTestId(/^ArticleListItem\//)
			await expect(items.nth(0)).toHaveAttribute('data-testid', 'ArticleListItem/First article/0')
			await expect(items.nth(1)).toHaveAttribute('data-testid', 'ArticleListItem/Second article/0')

			// Drop "Second article" onto the TOP half of "First article" -> it lands before it
			await dragEntityOnto(
				page,
				page.getByText('Second article'),
				page.getByTestId('ArticleListItem/First article/0'),
				'top',
			)
			await expect(items.nth(0)).toHaveAttribute('data-testid', 'ArticleListItem/Second article/0')
			await expect(items.nth(1)).toHaveAttribute('data-testid', 'ArticleListItem/First article/0')

			// Drop "Second article" onto the BOTTOM half of "First article" -> it lands after it again
			await dragEntityOnto(
				page,
				page.getByText('Second article'),
				page.getByTestId('ArticleListItem/First article/0'),
				'bottom',
			)
			await expect(items.nth(0)).toHaveAttribute('data-testid', 'ArticleListItem/First article/0')
			await expect(items.nth(1)).toHaveAttribute('data-testid', 'ArticleListItem/Second article/0')
		})

		test('shift-click multiselect -> drag the stack -> entities move together preserving order', async ({
			page,
		}) => {
			// Prepare world with a mix of entity types
			const world = await createWorld(page)
			await createWikiArticle(page, world, { name: 'Alpha article' })
			await createWikiFolder(page, world, { name: 'Beta folder' })
			await createWikiArticle(page, world, { name: 'Gamma article' })
			await createWikiArticle(page, world, { name: 'Delta article' })
			await navigateToWiki(page, world)

			const list = page.getByTestId('ArticleList/0')
			const items = list.getByTestId(/^ArticleListItem\//)

			// Sanity check the starting order
			await expect(items.nth(0)).toHaveAttribute('data-testid', 'ArticleListItem/Alpha article/0')
			await expect(items.nth(1)).toHaveAttribute('data-testid', 'ArticleListItem/Beta folder/0')
			await expect(items.nth(2)).toHaveAttribute('data-testid', 'ArticleListItem/Gamma article/0')
			await expect(items.nth(3)).toHaveAttribute('data-testid', 'ArticleListItem/Delta article/0')

			// Shift-click to select a contiguous stack of mixed types
			await page.getByText('Alpha article').click({ modifiers: ['Shift'] })
			await page.getByText('Gamma article').click({ modifiers: ['Shift'] })

			await expect(page.getByTestId('ArticleListItem/Alpha article/0').getByRole('checkbox')).toBeChecked()
			await expect(page.getByTestId('ArticleListItem/Beta folder/0').getByRole('checkbox')).toBeChecked()
			await expect(page.getByTestId('ArticleListItem/Gamma article/0').getByRole('checkbox')).toBeChecked()
			await expect(
				page.getByTestId('ArticleListItem/Delta article/0').getByRole('checkbox'),
			).not.toBeChecked()

			// Drag one member of the selection onto the bottom half of "Delta article" -> the whole stack follows
			await dragEntityOnto(
				page,
				page.getByText('Beta folder'),
				page.getByTestId('ArticleListItem/Delta article/0'),
				'bottom',
			)

			// Delta now sits first, with the moved stack after it in its original relative order
			await expect(items.nth(0)).toHaveAttribute('data-testid', 'ArticleListItem/Delta article/0')
			await expect(items.nth(1)).toHaveAttribute('data-testid', 'ArticleListItem/Alpha article/0')
			await expect(items.nth(2)).toHaveAttribute('data-testid', 'ArticleListItem/Beta folder/0')
			await expect(items.nth(3)).toHaveAttribute('data-testid', 'ArticleListItem/Gamma article/0')
		})
	})

	test.describe('mentions', () => {
		test('clicking @Mention button opens mentions list', async ({ page }) => {
			await navigateToWiki(page, 'createWorld')

			// Create article
			await createArticleViaUI(page, 'Testing article')
			await withYjsSocket(page, () => page.getByText('Testing article').click())
			await expect(page.getByTestId('EditableTitle').getByText('Testing article')).toBeVisible()

			// Click into the editor
			const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
			await expect(textbox).toBeVisible()
			await textbox.click()

			// Click the @Mention button and type a query
			await page.getByRole('button', { name: '@Mention' }).click()
			await page.keyboard.type('Test', { delay: 10 })

			// Expect the mentions list to be visible with Quick create options
			await expect(page.getByText('Quick create')).toBeVisible()
		})

		test('clicking @Mention button and pressing Enter inserts a mention', async ({ page }) => {
			await navigateToWiki(page, 'createWorld')

			// Create article
			await createArticleViaUI(page, 'Testing article')
			await withYjsSocket(page, () => page.getByText('Testing article').click())
			await expect(page.getByTestId('EditableTitle').getByText('Testing article')).toBeVisible()

			// Click into the editor and type some text
			const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
			await expect(textbox).toBeVisible()
			await textbox.click()
			await textbox.pressSequentially('Hello ', { delay: 10 })

			// Click the @Mention button, type a name, and press Enter to create
			await page.getByRole('button', { name: '@Mention' }).click()
			await page.keyboard.type('NewActor', { delay: 10 })
			await expect(page.getByText('Quick create')).toBeVisible()
			await withCreatedActor(page, () => page.keyboard.press('Enter'))

			// Expect the mention to be inserted (not a newline)
			await expect(textbox).toHaveText('Hello NewActor')
		})
	})

	test.describe('indentation', () => {
		test('tab inserts a tab character then indents, both survive a reload, shift-tab reverses', async ({
			page,
		}) => {
			await navigateToWiki(page, 'createWorld')

			// Create and open an article
			await createArticleViaUI(page, 'Testing article')
			await withYjsSocket(page, () => page.getByText('Testing article').click())

			const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
			await expect(textbox).toBeVisible()
			await textbox.click()

			// First Tab inserts a tab character, second Tab indents the paragraph
			const tab = textbox.locator('p span[data-type="tab"]')
			const paragraph = textbox.locator('p').first()
			await page.keyboard.press('Tab')
			await expect(tab).toHaveCount(1)
			await page.keyboard.press('Tab')
			await expect(paragraph).toHaveAttribute('data-indent', '1')
			await expect(tab).toHaveCount(1)

			// Shift-Tab removes the adjacent tab character first, then unindents
			await page.keyboard.press('Shift+Tab')
			await expect(tab).toHaveCount(0)
			await expect(paragraph).toHaveAttribute('data-indent', '1')
			await page.keyboard.press('Shift+Tab')
			await expect(paragraph).not.toHaveAttribute('data-indent')

			// Write an indented paragraph with both a tab character and block indent
			await page.keyboard.press('Tab')
			await page.keyboard.press('Tab')
			await textbox.pressSequentially('Indented paragraph', { delay: 10 })
			await expect(tab).toHaveCount(1)

			// Both survive a reload
			await withYjsSocket(page, () => page.reload())
			await expect(tab).toHaveCount(1)
			await expect(textbox.locator('p[data-indent="1"]', { hasText: 'Indented paragraph' })).toBeVisible()

			// Escape then Tab moves focus out instead of editing
			await textbox.click()
			await page.keyboard.press('Escape')
			await page.keyboard.press('Tab')
			await expect(tab).toHaveCount(1)
			await expect(textbox).not.toBeFocused()
		})

		test('tab nests list items instead of inserting a tab character', async ({ page }) => {
			await navigateToWiki(page, 'createWorld')

			// Create and open an article
			await createArticleViaUI(page, 'Testing article')
			await withYjsSocket(page, () => page.getByText('Testing article').click())

			const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
			await expect(textbox).toBeVisible()
			await textbox.click()

			// Create a two-item bullet list
			await textbox.pressSequentially('- First item', { delay: 10 })
			await page.keyboard.press('Enter')
			await textbox.pressSequentially('Second item', { delay: 10 })

			// Tab on the second item nests it as a sublist rather than inserting a tab character
			await page.keyboard.press('Tab')
			await expect(textbox.locator('ul ul li', { hasText: 'Second item' })).toBeVisible()
			await expect(textbox.locator('span[data-type="tab"]')).toHaveCount(0)

			// Shift-Tab lifts it back to the top level
			await page.keyboard.press('Shift+Tab')
			await expect(textbox.locator('ul ul')).not.toBeVisible()
			await expect(textbox.locator('ul > li', { hasText: 'Second item' })).toBeVisible()
		})
	})

	test.describe('shortcuts', () => {
		test('create article with simple shortcut', async ({ page }) => {
			await navigateToWiki(page, 'createWorld')

			// Create article
			await page.getByRole('button', { name: 'Create new object' }).click()
			await expect(page.getByText('Create new object', { exact: true })).toBeVisible()

			await page.getByRole('button', { name: 'Article', exact: true }).click()
			await page.getByPlaceholder('Name').fill('Testing article')
			await page.keyboard.press('Enter')
			await expect(page.getByText('Create new object', { exact: true })).not.toBeVisible()
			await expect(page.getByTestId('ArticleListItem/Testing article/0')).toBeVisible()
		})

		test('create article with full shortcut', async ({ page }) => {
			await navigateToWiki(page, 'createWorld')

			// Create article
			await page.getByRole('button', { name: 'Create new object' }).click()
			await expect(page.getByText('Create new object', { exact: true })).toBeVisible()

			await page.getByRole('button', { name: 'Article', exact: true }).click()
			await page.getByPlaceholder('Name').fill('Testing article')
			await page.keyboard.press('Control+Enter')

			await expect(page.getByText('Create new object', { exact: true })).not.toBeVisible()
			await expect(page.getByTestId('ArticleListItem/Testing article/0')).toBeVisible()
		})
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})

	async function dragRowToPoint(page: Page, source: Locator, x: number, y: number, dwellMs = 0) {
		const sourceBox = await source.boundingBox()
		if (!sourceBox) {
			throw new Error('Could not resolve the drag source bounding box')
		}
		const startX = sourceBox.x + sourceBox.width / 2
		const startY = sourceBox.y + sourceBox.height / 2

		await page.mouse.move(startX, startY)
		await page.mouse.down()
		// Nudge past the 3px threshold that distinguishes a drag from a click
		await page.mouse.move(startX + 6, startY + 6, { steps: 4 })
		await page.mouse.move(x, y, { steps: 12 })
		if (dwellMs > 0) {
			await page.waitForTimeout(dwellMs)
		}
		await page.mouse.up()
		await page.waitForTimeout(200)
	}

	async function rowDropPoint(target: Locator, half: 'top' | 'bottom') {
		const button = target.getByRole('button').first()
		const box = await button.boundingBox()
		if (!box) {
			throw new Error('Could not resolve the drop target bounding box')
		}
		return {
			x: box.x + box.width / 2,
			y: box.y + box.height * (half === 'top' ? 0.25 : 0.75),
		}
	}

	async function dragEntityOnto(page: Page, source: Locator, target: Locator, half: 'top' | 'bottom') {
		const { x, y } = await rowDropPoint(target, half)
		await dragRowToPoint(page, source, x, y)
	}

	async function dragEntityIntoFolder(page: Page, source: Locator, folder: Locator) {
		const { x, y } = await rowDropPoint(folder, 'bottom')
		await dragRowToPoint(page, source, x, y, 1000)
	}

	async function dragEntityToRoot(page: Page, source: Locator) {
		const list = page.getByTestId('ArticleList/0')
		const box = await list.boundingBox()
		if (!box) {
			throw new Error('Could not resolve the root list bounding box')
		}
		await dragRowToPoint(page, source, box.x + box.width / 2, box.y + box.height - 16)
	}

	async function createArticleViaUI(page: Page, name: string) {
		await page.getByRole('button', { name: 'Create new object' }).click()
		await page.getByRole('button', { name: 'Article', exact: true }).click()
		await page.getByPlaceholder('Name').fill(name)
		await page.getByRole('button', { name: 'Create', exact: true }).click()
		await expect(page.getByTestId(`ArticleListItem/${name}/0`)).toBeVisible()
	}

	async function withYjsSocket(page: Page, action: () => unknown) {
		const yjsRequest = page.waitForEvent('websocket', (ws) => {
			return ws.url().includes('/live/yjs')
		})
		await action()
		await yjsRequest
		await page.waitForTimeout(100)
	}

	async function withCreatedActor(page: Page, action: () => unknown) {
		const actorRequest = page.waitForRequest(
			(req) => req.method() === 'POST' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/actors/),
		)
		const worldUpdateRequest = page.waitForRequest(
			(req) => req.method() === 'GET' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+/),
		)
		await action()
		await actorRequest
		await worldUpdateRequest
	}
})
