import { Client } from '@modelcontextprotocol/sdk/client'
import { ContextService } from '@src/services/ContextService.js'
import { setupMockClient } from '@src/test-utils/setupMockClient.js'
import { setupTestServer } from '@src/test-utils/setupTestServer.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { generateEndpointMock } from '../../test-utils/generateEndpointMock.js'
import { mockNumericCalendar } from '../../test-utils/mockCalendar.js'
import { registerCreateEventTool } from './createEvent.tool.js'

const server = setupTestServer()

describe('create_event tool', () => {
	let client: Client

	beforeEach(async () => {
		client = await setupMockClient((server) => {
			registerCreateEventTool(server)
		})

		await ContextService.setCurrentUserId('default', 'user-123')
		ContextService.setCurrentWorld('default', 'world-456')
	})

	it('creates an event with name and timestamp', async () => {
		// checkEventDoesNotExist calls getWorldDetails
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

		const mock = generateEndpointMock(server, {
			method: 'post',
			path: '/api/world/world-456/event',
			response: {
				id: 'e-new',
				name: 'Dragon Attack',
				timestamp: '1440',
			},
		})

		const result = await client.callTool({
			name: 'create_event',
			arguments: { name: 'Dragon Attack', timestamp: '1440' },
		})

		const text = (result.content as Array<{ type: string; text: string }>)[0].text

		expect(result.isError).toBeUndefined()
		expect(text).toContain('Event created successfully')
		expect(text).toContain('Dragon Attack')
		expect(text).toContain('e-new')
		expect(text).toContain('1440')
		expect(mock.hasBeenCalled()).toBe(true)
	})

	it('creates an event with a description', async () => {
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

		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456/wiki/articles',
			response: [],
		})

		generateEndpointMock(server, {
			method: 'post',
			path: '/api/world/world-456/event',
			response: {
				id: 'e-desc',
				name: 'Peace Treaty',
				timestamp: '10000',
			},
		})

		const result = await client.callTool({
			name: 'create_event',
			arguments: {
				name: 'Peace Treaty',
				timestamp: '10000',
				description: '<p>The two kingdoms signed a peace treaty.</p>',
			},
		})

		expect(result.isError).toBeUndefined()
		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('Peace Treaty')
	})

	it('creates an event with a color', async () => {
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

		const mock = generateEndpointMock(server, {
			method: 'post',
			path: '/api/world/world-456/event',
			response: {
				id: 'e-color',
				name: 'Dragon Attack',
				timestamp: '1440',
				color: '#bf8a40',
			},
		})

		const result = await client.callTool({
			name: 'create_event',
			arguments: { name: 'Dragon Attack', timestamp: '1440', color: '#bf8a40' },
		})

		expect(result.isError).toBeUndefined()
		expect(mock.hasBeenCalled()).toBe(true)
		expect((mock.invocations[0].jsonBody as Record<string, unknown>).color).toBe('#bf8a40')
	})

	it('returns error when event already exists', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/world/world-456',
			response: {
				id: 'world-456',
				name: 'Test World',
				isReadOnly: false,
				calendars: [mockNumericCalendar()],
				events: [{ id: 'e1', name: 'Dragon Attack', timestamp: '100' }],
				actors: [],
				tags: [],
			},
		})

		const result = await client.callTool({
			name: 'create_event',
			arguments: { name: 'Dragon Attack', timestamp: '200' },
		})

		expect(result.isError).toBe(true)
		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('already exists')
	})

	it('returns an error when the API call fails', async () => {
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

		generateEndpointMock(server, {
			method: 'post',
			path: '/api/world/world-456/event',
			error: { status: 500, message: 'Server error' },
		})

		const result = await client.callTool({
			name: 'create_event',
			arguments: { name: 'Failing Event', timestamp: '0' },
		})

		expect(result.isError).toBe(true)
		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('Error creating event')
	})

	it('returns an error when no world is set', async () => {
		ContextService.setCurrentWorld('default', null)

		const result = await client.callTool({
			name: 'create_event',
			arguments: { name: 'No World Event', timestamp: '0' },
		})

		expect(result.isError).toBe(true)
	})

	it('resolves the timestamp into a numeric timestamp before sending it to the API', async () => {
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

		const mock = generateEndpointMock(server, {
			method: 'post',
			path: '/api/world/world-456/event',
			response: { id: 'e-new', name: 'Dragon Attack', timestamp: '1440' },
		})

		await client.callTool({
			name: 'create_event',
			arguments: { name: 'Dragon Attack', timestamp: '1440' },
		})

		expect(mock.hasBeenCalled()).toBe(true)
		expect((mock.invocations[0].jsonBody as Record<string, unknown>).timestamp).toBe(1440)
	})

	it('returns a helpful error when the timestamp cannot be parsed', async () => {
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
			name: 'create_event',
			arguments: { name: 'Dragon Attack', timestamp: 'not-a-real-date' },
		})

		expect(result.isError).toBe(true)
		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('Error creating event')
		expect(text).toContain('Unable to parse timestamp')
	})
})
