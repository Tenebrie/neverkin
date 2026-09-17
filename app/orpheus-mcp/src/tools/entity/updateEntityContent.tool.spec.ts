import { Client } from '@modelcontextprotocol/sdk/client'
import { ContextService } from '@src/services/ContextService.js'
import { generateEndpointMock } from '@src/test-utils/generateEndpointMock.js'
import { gandalfMention, mockEntityArticles, mockEntityWorld } from '@src/test-utils/mockEntityWorld.js'
import { setupMockClient } from '@src/test-utils/setupMockClient.js'
import { setupTestServer } from '@src/test-utils/setupTestServer.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { registerUpdateEntityContentTool } from './updateEntityContent.tool.js'

const server = setupTestServer()

describe('update_entity_content tool', () => {
	let client: Client

	beforeEach(async () => {
		client = await setupMockClient((server) => {
			registerUpdateEntityContentTool(server)
		})

		await ContextService.setCurrentUserId('default', 'user-123')
		ContextService.setCurrentWorld('default', 'world-456')

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
	})

	describe('set', () => {
		it('updates actor main content', async () => {
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/actor/a1/content',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Gandalf', set: '<p>Updated wizard description.</p>' },
			})

			expect(result.isError).toBeUndefined()
			expect(getText(result)).toContain('Main content has been updated')
			expect(mock.invocations[0].jsonBody).toMatchObject({ content: '<p>Updated wizard description.</p>' })
		})

		it('updates article main content and resolves mentions', async () => {
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/article/art-1/content',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Magic System', set: '<p>Mastered by @[Gandalf].</p>' },
			})

			expect(result.isError).toBeUndefined()
			expect(mock.invocations[0].jsonBody).toMatchObject({ content: `<p>Mastered by ${gandalfMention}.</p>` })
		})

		it('updates an existing page', async () => {
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/event/e1/content/pages/ep1',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Dragon Attack', pageName: 'Aftermath', set: '<p>Ruins.</p>' },
			})

			expect(result.isError).toBeUndefined()
			expect(getText(result)).toContain('Page "Aftermath" has been updated')
			expect(mock.hasBeenCalled()).toBe(true)
		})

		it('creates a new page when it does not exist', async () => {
			generateEndpointMock(server, {
				method: 'post',
				path: '/api/world/world-456/article/art-1/content/pages',
				response: { id: 'p-new', name: 'History' },
			})
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/article/art-1/content/pages/p-new',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Magic System', pageName: 'History', set: '<p>Ancient.</p>' },
			})

			expect(result.isError).toBeUndefined()
			expect(getText(result)).toContain('Page "History" has been created')
			expect(getText(result)).toContain('Page "History" has been updated')
			expect(mock.hasBeenCalled()).toBe(true)
		})

		it('accepts an empty string to clear content', async () => {
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/actor/a1/content',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Gandalf', set: '' },
			})

			expect(result.isError).toBeUndefined()
			expect(mock.invocations[0].jsonBody).toMatchObject({ content: '' })
		})
	})

	describe('replace', () => {
		it('replaces a unique snippet in main content', async () => {
			generateEndpointMock(server, {
				method: 'get',
				path: '/api/world/world-456/actor/a1/content',
				response: { contentHtml: '<p>A grey wizard.</p><p>Lives in Middle-earth.</p>' },
			})
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/actor/a1/content',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: {
					entityName: 'Gandalf',
					replace: { oldString: 'grey wizard', newString: 'white wizard' },
				},
			})

			expect(result.isError).toBeUndefined()
			expect(getText(result)).toContain('Main content has been updated')
			expect(mock.invocations[0].jsonBody).toMatchObject({
				content: '<p>A white wizard.</p><p>Lives in Middle-earth.</p>',
			})
		})

		it('replaces a snippet in a page', async () => {
			generateEndpointMock(server, {
				method: 'get',
				path: '/api/world/world-456/actor/a1/content/pages/p1',
				response: { contentHtml: '<p>Knows many spells.</p>' },
			})
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/actor/a1/content/pages/p1',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: {
					entityName: 'Gandalf',
					pageName: 'Knowledge',
					replace: { oldString: 'many', newString: 'all' },
				},
			})

			expect(result.isError).toBeUndefined()
			expect(getText(result)).toContain('Page "Knowledge" has been updated')
			expect(mock.invocations[0].jsonBody).toMatchObject({ content: '<p>Knows all spells.</p>' })
		})

		it('matches against agent-readable mentions and preserves existing ones', async () => {
			generateEndpointMock(server, {
				method: 'get',
				path: '/api/world/world-456/event/e1/content',
				response: { contentHtml: `<p>Fought by ${gandalfMention}.</p><p>Nobody died.</p>` },
			})
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/event/e1/content',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: {
					entityName: 'Dragon Attack',
					replace: { oldString: 'Nobody died', newString: 'Only @[Gandalf] survived' },
				},
			})

			expect(result.isError).toBeUndefined()
			expect(mock.invocations[0].jsonBody).toMatchObject({
				content: `<p>Fought by ${gandalfMention}.</p><p>Only ${gandalfMention} survived.</p>`,
			})
		})

		it('returns an error when the old content is not found', async () => {
			generateEndpointMock(server, {
				method: 'get',
				path: '/api/world/world-456/actor/a1/content',
				response: { contentHtml: '<p>A grey wizard.</p>' },
			})
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/actor/a1/content',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: {
					entityName: 'Gandalf',
					replace: { oldString: 'blue wizard', newString: 'white wizard' },
				},
			})

			expect(result.isError).toBe(true)
			expect(getText(result)).toContain('not found')
			expect(mock.hasBeenCalled()).toBe(false)
		})

		it('returns an error when the old content is ambiguous', async () => {
			generateEndpointMock(server, {
				method: 'get',
				path: '/api/world/world-456/actor/a1/content',
				response: { contentHtml: '<p>A wizard.</p><p>A wizard indeed.</p>' },
			})
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/actor/a1/content',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: {
					entityName: 'Gandalf',
					replace: { oldString: 'A wizard', newString: 'A sorcerer' },
				},
			})

			expect(result.isError).toBe(true)
			expect(getText(result)).toContain('appears 2 times')
			expect(mock.hasBeenCalled()).toBe(false)
		})
	})

	describe('entity resolution', () => {
		it('returns an error when the name is ambiguous across types', async () => {
			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Phoenix', set: '<p>Reborn.</p>' },
			})

			expect(result.isError).toBe(true)
			expect(getText(result)).toContain('Ambiguous name "Phoenix"')
		})

		it('resolves an ambiguous name when entityType is given', async () => {
			const mock = generateEndpointMock(server, {
				method: 'put',
				path: '/api/world/world-456/actor/a2/content',
				response: {},
			})

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Phoenix', entityType: 'actor', set: '<p>Reborn.</p>' },
			})

			expect(result.isError).toBeUndefined()
			expect(mock.hasBeenCalled()).toBe(true)
		})

		it('returns an error when the entity is not found', async () => {
			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Nonexistent', set: '<p>Content</p>' },
			})

			expect(result.isError).toBe(true)
			expect(getText(result)).toContain('Error updating entity content')
		})

		it('returns an error when no world is set', async () => {
			ContextService.setCurrentWorld('default', null)

			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Gandalf', set: '<p>Content</p>' },
			})

			expect(result.isError).toBe(true)
		})
	})

	describe('input validation', () => {
		it('rejects a call with neither set nor replace', async () => {
			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: { entityName: 'Gandalf' },
			})

			expect(result.isError).toBe(true)
			expect(getText(result)).toContain('Provide exactly one of "set" or "replace"')
		})

		it('rejects a call with both set and replace', async () => {
			const result = await client.callTool({
				name: 'update_entity_content',
				arguments: {
					entityName: 'Gandalf',
					set: '<p>Full</p>',
					replace: { oldString: 'a', newString: 'b' },
				},
			})

			expect(result.isError).toBe(true)
			expect(getText(result)).toContain('Provide exactly one of "set" or "replace"')
		})
	})
})

function getText(result: Awaited<ReturnType<Client['callTool']>>) {
	return (result.content as Array<{ type: string; text: string }>).map((c) => c.text).join('\n')
}
