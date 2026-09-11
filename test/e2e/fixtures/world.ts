import { expect, Page } from '@playwright/test'
import { makeUrl } from '@tests/utils'
import { randomBytes } from 'crypto'

import { withCreatedActor, withCreatedArticle, withCreatedEvent } from './withRequest'

export const createWorld = async (page: Page) => {
	const worldData = {
		name: 'My World',
		description: 'This is my world',
	}
	const rawResponse = await page.request.post(makeUrl('/api/worlds'), {
		data: worldData,
	})
	expect(rawResponse.ok()).toBeTruthy()
	const response = (await rawResponse.json()) as { id: string }
	return {
		...worldData,
		id: response.id,
	}
}

export const shareWorldWith = async (
	ownerPage: Page,
	worldData: Awaited<ReturnType<typeof createWorld>>,
	collaboratorPage: Page,
	accessMode: 'ReadOnly' | 'Editing' = 'Editing',
) => {
	const slug = `playwright-${randomBytes(8).toString('hex')}`

	const linkResponse = await ownerPage.request.post(makeUrl(`/api/world/${worldData.id}/share-link`), {
		data: {
			slug,
			label: 'Playwright share link',
			accessMode,
			// A link without an expiry date is never matched by the backend, so one is always required here
			expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
		},
	})
	expect(linkResponse.ok()).toBeTruthy()

	const acceptResponse = await collaboratorPage.request.post(makeUrl(`/api/share-link-visit/${slug}/accept`))
	expect(acceptResponse.ok()).toBeTruthy()

	return { world: worldData, slug }
}

export const navigateToDashboard = async (page: Page) => {
	await page.goto(makeUrl(`/`))
}

export const navigateToTimeline = async (
	page: Page,
	worldData: 'createWorld' | Awaited<ReturnType<typeof createWorld>>,
) => {
	if (worldData === 'createWorld') {
		worldData = await createWorld(page)
	}

	await page.goto(makeUrl(`/world/${worldData.id}/timeline`))
	return { world: worldData }
}

export const navigateToMindmap = async (
	page: Page,
	worldData: 'createWorld' | Awaited<ReturnType<typeof createWorld>>,
) => {
	if (worldData === 'createWorld') {
		worldData = await createWorld(page)
	}

	await page.goto(makeUrl(`/world/${worldData.id}/mindmap`))
	return { world: worldData }
}

export const navigateToWiki = async (
	page: Page,
	worldData: 'createWorld' | Awaited<ReturnType<typeof createWorld>>,
) => {
	if (worldData === 'createWorld') {
		worldData = await createWorld(page)
	}

	await page.goto(makeUrl(`/world/${worldData.id}/wiki`))
	return { world: worldData }
}

export async function closeModal(page: Page) {
	await page.getByTestId('ModalBackdrop').click({ position: { x: 0, y: 0 } })
}

export async function createEvent(page: Page, title: string) {
	await page.getByTestId('NavigateToTimeline').click()
	await page.getByText('Create event').click()
	await page.getByTestId('ModalBackdrop').getByRole('textbox').fill(title)
	await withCreatedEvent(
		page,
		async () => await page.getByTestId('ModalBackdrop').getByText('Create', { exact: true }).click(),
	)
}

export async function createActor(page: Page, name: string) {
	await page.getByTestId('NavigateToMindmap').click()
	await page.getByRole('button', { name: 'Create new object' }).click()
	await page.getByRole('button', { name: 'Actor', exact: true }).click()
	await page.getByPlaceholder('Name').fill(name)
	await withCreatedActor(
		page,
		async () => await page.getByRole('button', { name: 'Create', exact: true }).click(),
	)
}

export async function createArticle(page: Page, name: string) {
	await page.getByTestId('NavigateToWiki').click()
	await page.getByRole('button', { name: 'Create new object' }).click()
	await page.getByRole('button', { name: 'Article', exact: true }).click()
	await page.getByPlaceholder('Name').fill(name)
	await withCreatedArticle(
		page,
		async () => await page.getByRole('button', { name: 'Create', exact: true }).click(),
	)
}

export const createWikiArticle = async (
	page: Page,
	worldData: 'createWorld' | Awaited<ReturnType<typeof createWorld>>,
	article?: { name?: string },
) => {
	if (worldData === 'createWorld') {
		worldData = await createWorld(page)
	}

	const articleData = {
		name: 'My Article',
		...article,
	}
	const rawResponse = await page.request.post(makeUrl(`/api/world/${worldData.id}/wiki/articles`), {
		data: articleData,
	})
	expect(rawResponse.ok()).toBeTruthy()
	const response = (await rawResponse.json()) as { id: string }
	return {
		world: worldData,
		article: {
			...articleData,
			id: response.id,
		},
	}
}

export const createWikiFolder = async (
	page: Page,
	worldData: 'createWorld' | Awaited<ReturnType<typeof createWorld>>,
	folder?: { name?: string },
) => {
	if (worldData === 'createWorld') {
		worldData = await createWorld(page)
	}

	const folderData = {
		name: 'My Folder',
		...folder,
	}
	const rawResponse = await page.request.post(makeUrl(`/api/world/${worldData.id}/wiki/folders`), {
		data: folderData,
	})
	expect(rawResponse.ok()).toBeTruthy()
	const response = (await rawResponse.json()) as { id: string }
	return {
		world: worldData,
		folder: {
			...folderData,
			id: response.id,
		},
	}
}

export const navigateToWikiArticle = async (
	page: Page,
	worldData: 'createWorld' | Awaited<ReturnType<typeof createWorld>>,
	articleData: 'createArticle' | Awaited<ReturnType<typeof createWikiArticle>>['article'],
) => {
	if (worldData === 'createWorld') {
		worldData = await createWorld(page)
	}
	if (articleData === 'createArticle') {
		articleData = (await createWikiArticle(page, worldData)).article
	}

	await page.goto(makeUrl(`/world/${worldData.id}/wiki/${articleData.id}`))
	return { worldData, articleData }
}
