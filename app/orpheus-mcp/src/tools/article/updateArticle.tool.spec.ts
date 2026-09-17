import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { setupTestServer } from '@src/test-utils/setupTestServer.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { generateEndpointMock } from '../../test-utils/generateEndpointMock.js'
import { registerUpdateArticleTool } from './updateArticle.tool.js'

const server = setupTestServer()

describe('update_article tool', () => {
	let client: Client

	beforeEach(async () => {
		const mcpServer = new McpServer({ name: 'test-server', version: '0.0.1' })
		registerUpdateArticleTool(mcpServer)

		const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
		await mcpServer.connect(serverTransport)

		client = new Client({ name: 'test-client', version: '0.0.1' })
		await client.connect(clientTransport)

		await ContextService.setCurrentUserId('default', 'user-123')
		ContextService.setCurrentWorld('default', 'world-456')
	})

	it('updates an article name', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/wiki/articles',
			response: [{ id: 'art-1', name: 'Old Name' }],
		})

		generateEndpointMock(server, {
			method: 'patch',
			path: '/api/world/world-456/wiki/article/art-1',
			response: {
				id: 'art-1',
				name: 'New Name',
			},
		})

		const result = await client.callTool({
			name: 'update_article',
			arguments: { articleName: 'Old Name', name: 'New Name' },
		})

		const text = (result.content as Array<{ type: string; text: string }>)[0].text

		expect(result.isError).toBeUndefined()
		expect(text).toContain('Article updated successfully')
		expect(text).toContain('New Name')
	})

	it('updates an article color', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/wiki/articles',
			response: [{ id: 'art-1', name: 'Article' }],
		})

		const mock = generateEndpointMock(server, {
			method: 'patch',
			path: '/api/world/world-456/wiki/article/art-1',
			response: {
				id: 'art-1',
				name: 'Article',
				color: '#bf8a40',
			},
		})

		const result = await client.callTool({
			name: 'update_article',
			arguments: { articleName: 'Article', color: '#bf8a40' },
		})

		expect(result.isError).toBeUndefined()
		expect(mock.hasBeenCalled()).toBe(true)
		expect((mock.invocations[0].jsonBody as Record<string, unknown>).color).toBe('#bf8a40')
	})

	it('returns an error when article is not found', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/wiki/articles',
			response: [],
		})

		const result = await client.callTool({
			name: 'update_article',
			arguments: { articleName: 'Nonexistent', name: 'New name' },
		})

		expect(result.isError).toBe(true)
		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('Error updating article')
	})

	it('returns an error when no world is set', async () => {
		ContextService.setCurrentWorld('default', null)

		const result = await client.callTool({
			name: 'update_article',
			arguments: { articleName: 'Article', name: 'New name' },
		})

		expect(result.isError).toBe(true)
	})
})
