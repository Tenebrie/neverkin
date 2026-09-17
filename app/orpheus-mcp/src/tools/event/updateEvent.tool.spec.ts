import { Client } from '@modelcontextprotocol/sdk/client'
import { ContextService } from '@src/services/ContextService.js'
import { setupMockClient } from '@src/test-utils/setupMockClient.js'
import { setupTestServer } from '@src/test-utils/setupTestServer.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { generateEndpointMock } from '../../test-utils/generateEndpointMock.js'
import { mockNumericCalendar } from '../../test-utils/mockCalendar.js'
import { registerUpdateEventTool } from './updateEvent.tool.js'

const server = setupTestServer()

describe('update_event tool', () => {
	let client: Client

	beforeEach(async () => {
		client = await setupMockClient((server) => {
			registerUpdateEventTool(server)
		})

		await ContextService.setCurrentUserId('default', 'user-123')
		ContextService.setCurrentWorld('default', 'world-456')
	})

	it('updates an event name', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: {
				id: 'world-456',
				name: 'Test World',
				isReadOnly: false,
				calendars: [mockNumericCalendar()],
				events: [{ id: 'e1', name: 'Battle', timestamp: '100' }],
				actors: [],
				tags: [],
			},
		})

		generateEndpointMock(server, {
			method: 'patch',
			path: '/api/world/world-456/event/e1',
			response: {
				id: 'e1',
				name: 'Great Battle',
				timestamp: '100',
			},
		})

		const result = await client.callTool({
			name: 'update_event',
			arguments: { eventName: 'Battle', name: 'Great Battle' },
		})

		const text = (result.content as Array<{ type: string; text: string }>)[0].text

		expect(result.isError).toBeUndefined()
		expect(text).toContain('Event updated successfully')
		expect(text).toContain('Great Battle')
	})

	it('updates an event timestamp', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: {
				id: 'world-456',
				name: 'Test World',
				isReadOnly: false,
				calendars: [mockNumericCalendar()],
				events: [{ id: 'e1', name: 'Battle', timestamp: '100' }],
				actors: [],
				tags: [],
			},
		})

		generateEndpointMock(server, {
			method: 'patch',
			path: '/api/world/world-456/event/e1',
			response: {
				id: 'e1',
				name: 'Battle',
				timestamp: '5000',
			},
		})

		const result = await client.callTool({
			name: 'update_event',
			arguments: { eventName: 'Battle', timestamp: '5000' },
		})

		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('Timestamp: 5000')
	})

	it('updates an event color', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: {
				id: 'world-456',
				name: 'Test World',
				isReadOnly: false,
				calendars: [mockNumericCalendar()],
				events: [{ id: 'e1', name: 'Battle', timestamp: '100' }],
				actors: [],
				tags: [],
			},
		})

		const mock = generateEndpointMock(server, {
			method: 'patch',
			path: '/api/world/world-456/event/e1',
			response: {
				id: 'e1',
				name: 'Battle',
				timestamp: '100',
				color: '#bf8a40',
			},
		})

		const result = await client.callTool({
			name: 'update_event',
			arguments: { eventName: 'Battle', color: '#bf8a40' },
		})

		expect(result.isError).toBeUndefined()
		expect(mock.hasBeenCalled()).toBe(true)
		expect((mock.invocations[0].jsonBody as Record<string, unknown>).color).toBe('#bf8a40')
	})

	it('returns an error when event is not found', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: {
				id: 'world-456',
				name: 'Test World',
				isReadOnly: false,
				calendars: [mockNumericCalendar()],
				events: [],
				actors: [],
				tags: [],
			},
		})

		const result = await client.callTool({
			name: 'update_event',
			arguments: { eventName: 'Nonexistent', name: 'New name' },
		})

		expect(result.isError).toBe(true)
		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('Error updating event')
	})

	it('returns an error when no world is set', async () => {
		ContextService.setCurrentWorld('default', null)

		const result = await client.callTool({
			name: 'update_event',
			arguments: { eventName: 'Battle', name: 'New name' },
		})

		expect(result.isError).toBe(true)
	})
})
