import { Client } from '@modelcontextprotocol/sdk/client'
import { ContextService } from '@src/services/ContextService.js'
import { generateEndpointMock } from '@src/test-utils/generateEndpointMock.js'
import { gandalfMention, mockEntityArticles, mockEntityWorld } from '@src/test-utils/mockEntityWorld.js'
import { setupMockClient } from '@src/test-utils/setupMockClient.js'
import { setupTestServer } from '@src/test-utils/setupTestServer.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { registerGetEntityDetailsTool } from './getEntityDetails.tool.js'

const server = setupTestServer()

describe('get_entity_details tool', () => {
	let client: Client

	beforeEach(async () => {
		client = await setupMockClient((server) => {
			registerGetEntityDetailsTool(server)
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

	it('returns actor details with main content', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/actor/a1/content',
			response: { contentHtml: '<p>A powerful wizard.</p>' },
		})

		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Gandalf' },
		})

		expect(result.isError).toBeUndefined()
		const text = getText(result)
		expect(text).toContain('Actor: Gandalf')
		expect(text).toContain('ID: a1')
		expect(text).toContain('Title: The Grey')
		expect(text).toContain('Color: #bf8a40')
		expect(text).toContain('Page: (Main content)')
		expect(text).toContain('<p>A powerful wizard.</p>')
		expect(text).toContain('Pages: "Knowledge"')
		expect(text).toContain('Mentioned in:\n- [event] Dragon Attack')
	})

	it('returns event details with a formatted timestamp', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/event/e1/content',
			response: { contentHtml: `<p>Attacked by ${gandalfMention}.</p>` },
		})

		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Dragon Attack' },
		})

		expect(result.isError).toBeUndefined()
		const text = getText(result)
		expect(text).toContain('Event: Dragon Attack')
		expect(text).toContain('DateTime: 1440')
		expect(text).toContain('Color: #ff0000')
		expect(text).not.toContain('Title:')
		expect(text).toContain('<p>Attacked by @[Gandalf].</p>')
		expect(text).toContain('Mentions:\n- [actor] Gandalf, The Grey')
	})

	it('returns article details', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/article/art-1/content',
			response: { contentHtml: '' },
		})

		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Magic System' },
		})

		expect(result.isError).toBeUndefined()
		const text = getText(result)
		expect(text).toContain('Article: Magic System')
		expect(text).toContain('ID: art-1')
		expect(text).toContain('Color: #00ff00')
		expect(text).toContain('(No content provided)')
		expect(text).toContain('Pages: (None)')
	})

	it('returns content for a specific page', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/event/e1/content/pages/ep1',
			response: { contentHtml: '<p>Ruins everywhere.</p>' },
		})

		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Dragon Attack', pageName: 'Aftermath' },
		})

		expect(result.isError).toBeUndefined()
		expect(getText(result)).toContain('Page: Aftermath')
		expect(getText(result)).toContain('<p>Ruins everywhere.</p>')
	})

	it('uses fuzzy matching', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/event/e1/content',
			response: { contentHtml: '' },
		})

		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'dragon' },
		})

		expect(result.isError).toBeUndefined()
		expect(getText(result)).toContain('Event: Dragon Attack')
	})

	it('returns an error when the name is ambiguous across types', async () => {
		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Phoenix' },
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('Ambiguous name "Phoenix"')
		expect(getText(result)).toContain('actor "Phoenix", article "Phoenix"')
	})

	it('resolves an ambiguous name when entityType is given', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/article/art-2/content',
			response: { contentHtml: '' },
		})

		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Phoenix', entityType: 'article' },
		})

		expect(result.isError).toBeUndefined()
		expect(getText(result)).toContain('Article: Phoenix')
	})

	it('shows (None) for a missing title and color', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/actor/a2/content',
			response: { contentHtml: '' },
		})

		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Phoenix', entityType: 'actor' },
		})

		expect(result.isError).toBeUndefined()
		expect(getText(result)).toContain('Title: (None)')
		expect(getText(result)).toContain('Color: (None)')
	})

	it('returns an error when the entity is not found', async () => {
		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Nonexistent' },
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('Error fetching entity details')
	})

	it('returns an error when the page is not found', async () => {
		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Gandalf', pageName: 'Missing' },
		})

		expect(result.isError).toBe(true)
		expect(getText(result)).toContain('Error fetching entity details')
	})

	it('returns an error when no world is set', async () => {
		ContextService.setCurrentWorld('default', null)

		const result = await client.callTool({
			name: 'get_entity_details',
			arguments: { entityName: 'Gandalf' },
		})

		expect(result.isError).toBe(true)
	})
})

function getText(result: Awaited<ReturnType<Client['callTool']>>) {
	return (result.content as Array<{ type: string; text: string }>).map((c) => c.text).join('\n')
}
