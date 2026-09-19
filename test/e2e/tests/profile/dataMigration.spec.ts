import { createNewUser, deleteAccount } from '@fixtures/auth'
import { expect, Page, test } from '@playwright/test'
import { makeUrl } from '@tests/utils'
import { readFile } from 'fs/promises'

import type {
	CreateActorApiArg,
	CreateActorApiResponse,
} from '../../../../app/styx-frontend/src/api/actorListApi'
import type { ExportUserDataInlineApiResponse } from '../../../../app/styx-frontend/src/api/dataMigrationApi'
import type {
	CreateMindmapWiresApiArg,
	CreateMindmapWiresApiResponse,
	CreateNodeApiArg,
	CreateNodeApiResponse,
} from '../../../../app/styx-frontend/src/api/mindmapApi'
import type {
	CreateWorldEventApiArg,
	CreateWorldEventApiResponse,
} from '../../../../app/styx-frontend/src/api/worldEventApi'
import type {
	CreateWorldApiArg,
	CreateWorldApiResponse,
} from '../../../../app/styx-frontend/src/api/worldListApi'
import type {
	CreateArticleApiArg,
	CreateArticleApiResponse,
} from '../../../../app/styx-frontend/src/api/worldWikiApi'

async function postJson<TResponse>(page: Page, path: string, body?: unknown): Promise<TResponse> {
	const response = await page.request.post(
		makeUrl(path),
		body === undefined ? undefined : { data: body as object },
	)
	expect(response.ok(), `POST ${path} failed: ${response.status()} ${await response.text()}`).toBeTruthy()
	return (await response.json()) as TResponse
}

async function createWorld(page: Page, body: CreateWorldApiArg['body']) {
	return postJson<CreateWorldApiResponse>(page, '/api/worlds', body)
}

async function createActor(page: Page, worldId: string, body: CreateActorApiArg['body']) {
	return postJson<CreateActorApiResponse>(page, `/api/world/${worldId}/actors`, body)
}

async function createEvent(page: Page, worldId: string, body: CreateWorldEventApiArg['body']) {
	return postJson<CreateWorldEventApiResponse>(page, `/api/world/${worldId}/event`, body)
}

async function createArticle(page: Page, worldId: string, body: CreateArticleApiArg['body']) {
	return postJson<CreateArticleApiResponse>(page, `/api/world/${worldId}/wiki/articles`, body)
}

async function createMindmapNode(page: Page, worldId: string, body: CreateNodeApiArg['body']) {
	return postJson<CreateNodeApiResponse>(page, `/api/world/${worldId}/mindmap/nodes`, body)
}

async function createMindmapWires(page: Page, worldId: string, body: CreateMindmapWiresApiArg['body']) {
	return postJson<CreateMindmapWiresApiResponse>(page, `/api/world/${worldId}/mindmap/wires`, body)
}

async function deleteWorld(page: Page, worldId: string) {
	const response = await page.request.delete(makeUrl(`/api/world/${worldId}`))
	expect(response.ok()).toBeTruthy()
}

async function exportUserDataInline(page: Page) {
	return postJson<ExportUserDataInlineApiResponse>(page, '/api/export/user-data/inline')
}

type WorldFingerprint = {
	id: string
	name: string
	actorNames: string[]
	eventNames: string[]
	articleNames: string[]
	mindmapNodes: string[]
	mindmapLinkPairs: string[]
}

function fingerprintWorlds(data: ExportUserDataInlineApiResponse): WorldFingerprint[] {
	return [...data.user.worlds]
		.sort((a, b) => a.id.localeCompare(b.id))
		.map((world) => ({
			id: world.id,
			name: world.name,
			actorNames: world.actors.map((a) => a.name).sort(),
			eventNames: world.events.map((e) => e.name).sort(),
			articleNames: world.articles.map((a) => a.name).sort(),
			mindmapNodes: world.mindmapNodes
				.map((n) => `${n.id}:${n.parentActorId ?? n.parentArticleId ?? 'plain'}:${n.name}`)
				.sort(),
			mindmapLinkPairs: world.mindmapNodes
				.flatMap((n) => n.links.map((l) => `${l.sourceNodeId}->${l.targetNodeId}`))
				.sort(),
		}))
}

async function seedWorld(page: Page, name: string) {
	const world = await createWorld(page, { name, description: `Description for ${name}` })

	const hero = await createActor(page, world.id, { name: `${name} Hero`, title: 'Hero' })
	const villain = await createActor(page, world.id, { name: `${name} Villain`, title: 'Villain' })

	await createEvent(page, world.id, { name: `${name} Founding`, contentRich: '{}', timestamp: '0' })
	await createEvent(page, world.id, { name: `${name} Battle`, contentRich: '{}', timestamp: '1000' })

	const lore = await createArticle(page, world.id, { name: `${name} Lore` })
	await createArticle(page, world.id, { name: `${name} History` })

	const heroNode = await createMindmapNode(page, world.id, {
		positionX: 0,
		positionY: 0,
		parentActorId: hero.id,
	})
	const villainNode = await createMindmapNode(page, world.id, {
		positionX: 100,
		positionY: 100,
		parentActorId: villain.id,
	})
	const loreNode = await createMindmapNode(page, world.id, {
		positionX: 200,
		positionY: 200,
		parentArticleId: lore.id,
	})
	const plainNode = await createMindmapNode(page, world.id, {
		positionX: 300,
		positionY: 300,
		name: `${name} Note`,
	})
	await createMindmapWires(page, world.id, {
		wires: [
			{ sourceNodeId: heroNode.id, targetNodeId: villainNode.id },
			{ sourceNodeId: loreNode.id, targetNodeId: plainNode.id },
		],
	})

	return world
}

async function importJsonInUi(page: Page, json: string) {
	await page.goto(makeUrl('/profile/migration'))

	const fileInput = page.locator('input[type="file"][accept*="json"]')
	await fileInput.setInputFiles({
		name: 'export.json',
		mimeType: 'application/json',
		buffer: Buffer.from(json),
	})

	await page.getByRole('button', { name: 'Upload & Validate', exact: true }).click()
	await expect(page.getByText('Data validated successfully. You can now run the import.')).toBeVisible()

	await page.getByRole('button', { name: 'Import', exact: true }).click()
	await expect(page.getByText('Data imported successfully.')).toBeVisible()
}

test.describe('Data export/import', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})

	test('round-trips through the UI export and re-import flows', async ({ page }) => {
		test.setTimeout(60000)

		await seedWorld(page, 'Alpha')
		await seedWorld(page, 'Beta')

		const initialFingerprint = fingerprintWorlds(await exportUserDataInline(page))
		expect(initialFingerprint).toHaveLength(2)
		for (const world of initialFingerprint) {
			expect(world.actorNames).toHaveLength(2)
			expect(world.eventNames).toHaveLength(2)
			expect(world.articleNames).toHaveLength(2)
			expect(world.mindmapNodes).toHaveLength(4)
			expect(world.mindmapNodes.filter((n) => n.includes(':plain:'))).toHaveLength(1)
			expect(world.mindmapLinkPairs).toHaveLength(2)
		}

		// Trigger the UI export — the click resolves a presigned URL and starts a download
		await page.goto(makeUrl('/profile/migration'))

		const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
		await page.getByRole('button', { name: 'Export', exact: true }).click()
		const download = await downloadPromise
		expect(download.suggestedFilename()).toMatch(/^DataExport-\d{4}-\d{2}-\d{2} \d{2}_\d{2}_\d{2}\.json$/)

		const downloadPath = await download.path()
		const exportedJson = await readFile(downloadPath, 'utf8')

		// Re-import the same data into the same user — should be idempotent
		await importJsonInUi(page, exportedJson)
		expect(fingerprintWorlds(await exportUserDataInline(page))).toEqual(initialFingerprint)

		// Wipe both worlds and confirm the export is now empty
		for (const world of initialFingerprint) {
			await deleteWorld(page, world.id)
		}
		expect(fingerprintWorlds(await exportUserDataInline(page))).toEqual([])

		// Re-import the original file and confirm everything is restored
		await importJsonInUi(page, exportedJson)
		expect(fingerprintWorlds(await exportUserDataInline(page))).toEqual(initialFingerprint)
	})
})
