import { Client } from '@modelcontextprotocol/sdk/client'
import { ContextService } from '@src/services/ContextService.js'
import { generateEndpointMock } from '@src/test-utils/generateEndpointMock.js'
import { gandalfMention, mockEntityArticles, mockEntityWorld } from '@src/test-utils/mockEntityWorld.js'
import { setupMockClient } from '@src/test-utils/setupMockClient.js'
import { setupTestServer } from '@src/test-utils/setupTestServer.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { registerCreateEntitiesTool } from './createEntities.tool.js'

const server = setupTestServer()

const emptyWorld = { ...mockEntityWorld, actors: [], events: [], tags: [] }

describe('create_entities tool', () => {
	let client: Client

	beforeEach(async () => {
		client = await setupMockClient((server) => {
			registerCreateEntitiesTool(server)
		})

		await ContextService.setCurrentUserId('default', 'user-123')
		ContextService.setCurrentWorld('default', 'world-456')

		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: emptyWorld,
		})
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/wiki/articles',
			response: [],
		})
	})

	it('creates one entity of each type', async () => {
		const actorMock = mockCreate('actors', { id: 'a-new', name: 'Gandalf' })
		const eventMock = mockCreate('event', { id: 'e-new', name: 'Dragon Attack', timestamp: '1440' })
		const articleMock = mockCreate('wiki/articles', { id: 'art-new', name: 'Magic System' })
		const tagMock = mockCreate('tags', { id: 't-new', name: 'Important' })

		const result = await client.callTool({
			name: 'create_entities',
			arguments: {
				entities: [
					{ type: 'actor', name: 'Gandalf', title: 'The Grey', color: '#bf8a40' },
					{ type: 'event', name: 'Dragon Attack', timestamp: '1440' },
					{ type: 'article', name: 'Magic System' },
					{ type: 'tag', name: 'Important', description: 'Key lore' },
				],
			},
		})

		expect(result.isError).toBeUndefined()
		const text = getText(result)
		expect(text).toContain('Created actor: Gandalf (The Grey)')
		expect(text).toContain('Created event: Dragon Attack (1440)')
		expect(text).toContain('Created article: Magic System')
		expect(text).toContain('Created tag: Important')
		expect(actorMock.invocations[0].jsonBody).toMatchObject({
			name: 'Gandalf',
			title: 'The Grey',
			color: '#bf8a40',
		})
		expect(eventMock.invocations[0].jsonBody).toMatchObject({ name: 'Dragon Attack', timestamp: 1440 })
		expect(articleMock.invocations[0].jsonBody).toMatchObject({ name: 'Magic System' })
		expect(tagMock.invocations[0].jsonBody).toMatchObject({ name: 'Important', description: 'Key lore' })
	})

	it('writes content after creating, resolving mentions to entities from the same batch', async () => {
		mockCreate('actors', { id: 'a1', name: 'Gandalf' })
		mockCreate('wiki/articles', { id: 'art-1', name: 'Magic System' })
		// Validation sees the empty world once; the refetch after creation sees the new entities.
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: mockEntityWorld,
		})
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/wiki/articles',
			response: mockEntityArticles,
		})
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: emptyWorld,
			once: true,
		})
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/wiki/articles',
			response: [],
			once: true,
		})
		const contentMock = generateEndpointMock(server, {
			method: 'put',
			path: '/api/world/world-456/article/art-1/content',
			response: {},
		})

		const result = await client.callTool({
			name: 'create_entities',
			arguments: {
				entities: [
					{ type: 'actor', name: 'Gandalf' },
					{ type: 'article', name: 'Magic System', content: '<p>Mastered by @[Gandalf].</p>' },
				],
			},
		})

		expect(result.isError).toBeUndefined()
		expect(getText(result)).toContain('Content set for article "Magic System"')
		expect(contentMock.invocations[0].jsonBody).toMatchObject({
			content: `<p>Mastered by ${gandalfMention}.</p>`,
		})
	})

	it('writes nothing when a name already exists', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: mockEntityWorld,
		})
		const actorMock = mockCreate('actors', { id: 'a-new', name: 'Frodo' })

		const result = await client.callTool({
			name: 'create_entities',
			arguments: {
				entities: [
					{ type: 'actor', name: 'Frodo' },
					{ type: 'actor', name: 'gandalf' },
				],
			},
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('actor "gandalf" already exists')
		expect(actorMock.hasBeenCalled()).toBe(false)
	})

	it('writes nothing when a name repeats within the batch', async () => {
		const actorMock = mockCreate('actors', { id: 'a-new', name: 'Frodo' })

		const result = await client.callTool({
			name: 'create_entities',
			arguments: {
				entities: [
					{ type: 'actor', name: 'Frodo' },
					{ type: 'actor', name: 'Frodo' },
				],
			},
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('appears more than once')
		expect(actorMock.hasBeenCalled()).toBe(false)
	})

	it('allows the same name across different types', async () => {
		mockCreate('actors', { id: 'a-new', name: 'Phoenix' })
		mockCreate('wiki/articles', { id: 'art-new', name: 'Phoenix' })

		const result = await client.callTool({
			name: 'create_entities',
			arguments: {
				entities: [
					{ type: 'actor', name: 'Phoenix' },
					{ type: 'article', name: 'Phoenix' },
				],
			},
		})

		expect(result.isError).toBeUndefined()
	})

	it('writes nothing when a timestamp cannot be parsed', async () => {
		const actorMock = mockCreate('actors', { id: 'a-new', name: 'Frodo' })

		const result = await client.callTool({
			name: 'create_entities',
			arguments: {
				entities: [
					{ type: 'actor', name: 'Frodo' },
					{ type: 'event', name: 'Battle', timestamp: 'not-a-real-date' },
				],
			},
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('Unable to parse timestamp')
		expect(actorMock.hasBeenCalled()).toBe(false)
	})

	it('reports what was created when a later create fails', async () => {
		mockCreate('actors', { id: 'a-new', name: 'Frodo' })
		generateEndpointMock(server, {
			method: 'post',
			path: '/api/world/world-456/event',
			error: { status: 500, message: 'Server error' },
		})

		const result = await client.callTool({
			name: 'create_entities',
			arguments: {
				entities: [
					{ type: 'actor', name: 'Frodo' },
					{ type: 'event', name: 'Battle', timestamp: '10' },
				],
			},
		})

		expect(result.isError).toBe(true)
		const text = getText(result)
		expect(text).toContain('Created actor: Frodo')
		expect(text).toContain('Error creating entities')
	})

	it('rejects an empty batch', async () => {
		const result = await client.callTool({
			name: 'create_entities',
			arguments: { entities: [] },
		})

		expect(result.isError).toBe(true)
	})

	it('rejects a batch larger than 20', async () => {
		const tagMock = mockCreate('tags', { id: 't-new', name: 'Tag' })
		const entities = Array.from({ length: 21 }, (_, i) => ({ type: 'tag', name: `Tag ${i}` }))

		const result = await client.callTool({
			name: 'create_entities',
			arguments: { entities },
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('20')
		expect(tagMock.hasBeenCalled()).toBe(false)
	})

	it('returns an error when no world is set', async () => {
		ContextService.setCurrentWorld('default', null)

		const result = await client.callTool({
			name: 'create_entities',
			arguments: { entities: [{ type: 'tag', name: 'Important' }] },
		})

		expect(result.isError).toBe(true)
	})
})

function mockCreate(path: string, response: Record<string, unknown>) {
	return generateEndpointMock(server, {
		method: 'post',
		path: `/api/world/world-456/${path}`,
		response,
	})
}

function getText(result: Awaited<ReturnType<Client['callTool']>>) {
	return (result.content as Array<{ type: string; text: string }>).map((c) => c.text).join('\n')
}
