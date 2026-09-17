import { Client } from '@modelcontextprotocol/sdk/client'
import { ContextService } from '@src/services/ContextService.js'
import { generateEndpointMock } from '@src/test-utils/generateEndpointMock.js'
import { mockEntityArticles, mockEntityWorld } from '@src/test-utils/mockEntityWorld.js'
import { setupMockClient } from '@src/test-utils/setupMockClient.js'
import { setupTestServer } from '@src/test-utils/setupTestServer.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { registerDeleteEntityContentPageTool } from './deleteEntityContentPage.tool.js'

const server = setupTestServer()

describe('delete_entity_content_page tool', () => {
	let client: Client

	beforeEach(async () => {
		client = await setupMockClient((server) => {
			registerDeleteEntityContentPageTool(server)
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

	it('deletes an actor page', async () => {
		const mock = generateEndpointMock(server, {
			method: 'delete',
			path: '/api/world/world-456/actor/a1/content/pages/p1',
			response: {},
		})

		const result = await client.callTool({
			name: 'delete_entity_content_page',
			arguments: { entityName: 'Gandalf', pageName: 'Knowledge' },
		})

		expect(result.isError).toBeUndefined()
		expect(getText(result)).toContain('Content page "Knowledge" has been deleted from actor "Gandalf"')
		expect(mock.hasBeenCalled()).toBe(true)
	})

	it('deletes an event page', async () => {
		const mock = generateEndpointMock(server, {
			method: 'delete',
			path: '/api/world/world-456/event/e1/content/pages/ep1',
			response: {},
		})

		const result = await client.callTool({
			name: 'delete_entity_content_page',
			arguments: { entityName: 'Dragon Attack', pageName: 'Aftermath' },
		})

		expect(result.isError).toBeUndefined()
		expect(getText(result)).toContain('from event "Dragon Attack"')
		expect(mock.hasBeenCalled()).toBe(true)
	})

	it('resolves an ambiguous name when entityType is given', async () => {
		const mock = generateEndpointMock(server, {
			method: 'delete',
			path: '/api/world/world-456/article/art-2/content/pages/ap1',
			response: {},
		})

		const result = await client.callTool({
			name: 'delete_entity_content_page',
			arguments: { entityName: 'Phoenix', entityType: 'article', pageName: 'Rebirth' },
		})

		expect(result.isError).toBeUndefined()
		expect(mock.hasBeenCalled()).toBe(true)
	})

	it('returns an error when the entity is not found', async () => {
		const result = await client.callTool({
			name: 'delete_entity_content_page',
			arguments: { entityName: 'Nonexistent', pageName: 'Knowledge' },
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('Error deleting content page')
	})

	it('returns an error when the page is not found', async () => {
		const result = await client.callTool({
			name: 'delete_entity_content_page',
			arguments: { entityName: 'Gandalf', pageName: 'Missing' },
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('Error deleting content page')
	})

	it('returns an error when no world is set', async () => {
		ContextService.setCurrentWorld('default', null)

		const result = await client.callTool({
			name: 'delete_entity_content_page',
			arguments: { entityName: 'Gandalf', pageName: 'Knowledge' },
		})

		expect(result.isError).toBe(true)
	})
})

function getText(result: Awaited<ReturnType<Client['callTool']>>) {
	return (result.content as Array<{ type: string; text: string }>).map((c) => c.text).join('\n')
}
