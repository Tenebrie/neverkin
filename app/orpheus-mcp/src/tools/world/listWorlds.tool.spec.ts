import { Client } from '@modelcontextprotocol/sdk/client'
import { ContextService } from '@src/services/ContextService.js'
import { setupMockClient } from '@src/test-utils/setupMockClient.js'
import { setupTestServer } from '@src/test-utils/setupTestServer.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { generateEndpointMock } from '../../test-utils/generateEndpointMock.js'
import { mockNumericCalendar } from '../../test-utils/mockCalendar.js'
import { registerListWorldsTool } from './listWorlds.tool.js'

const server = setupTestServer()

describe('list_worlds tool', () => {
	let client: Client

	beforeEach(async () => {
		client = await setupMockClient((server) => {
			registerListWorldsTool(server)
		})

		await ContextService.setCurrentUserId('default', 'user-123')
	})

	it('returns a list of worlds', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/worlds',
			response: {
				ownedWorlds: [
					{ id: 'w1', name: 'My World', accessMode: 'Private', calendars: [mockNumericCalendar()] },
					{ id: 'w2', name: 'Second World', accessMode: 'PublicRead', calendars: [mockNumericCalendar()] },
				],
				contributableWorlds: [],
				visibleWorlds: [],
			},
		})

		const result = await client.callTool({
			name: 'list_worlds',
			arguments: {},
		})

		const texts = (result.content as Array<{ type: string; text: string }>).map((c) => c.text)
		const allText = texts.join('\n')

		expect(result.isError).toBeUndefined()
		expect(allText).toContain('My World')
		expect(allText).toContain('Second World')
		expect(allText).toContain('w1')
		expect(allText).toContain('w2')
		expect(allText).toContain('set_context')
	})

	it('auto-selects the world when only one is available', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/worlds',
			response: {
				ownedWorlds: [
					{
						id: 'only-world',
						name: 'Lonely World',
						accessMode: 'Private',
						calendars: [mockNumericCalendar()],
					},
				],
				contributableWorlds: [],
				visibleWorlds: [],
			},
		})

		const result = await client.callTool({
			name: 'list_worlds',
			arguments: {},
		})

		const texts = (result.content as Array<{ type: string; text: string }>).map((c) => c.text)
		const allText = texts.join('\n')

		expect(result.isError).toBeUndefined()
		expect(allText).toContain('Lonely World')
		expect(allText).toContain('automatically set as current context')
		expect(await ContextService.getCurrentWorld('default')).toBe('only-world')
	})

	it('includes worlds from all categories', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/worlds',
			response: {
				ownedWorlds: [
					{ id: 'w1', name: 'Owned World', accessMode: 'Private', calendars: [mockNumericCalendar()] },
				],
				contributableWorlds: [
					{ id: 'w2', name: 'Contrib World', accessMode: 'PublicEdit', calendars: [mockNumericCalendar()] },
				],
				visibleWorlds: [
					{ id: 'w3', name: 'Visible World', accessMode: 'PublicRead', calendars: [mockNumericCalendar()] },
				],
			},
		})

		const result = await client.callTool({
			name: 'list_worlds',
			arguments: {},
		})

		const texts = (result.content as Array<{ type: string; text: string }>).map((c) => c.text)
		const allText = texts.join('\n')

		expect(allText).toContain('Owned World')
		expect(allText).toContain('Contrib World')
		expect(allText).toContain('Visible World')
	})

	it('returns empty list when no worlds exist', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/worlds',
			response: {
				ownedWorlds: [],
				contributableWorlds: [],
				visibleWorlds: [],
			},
		})

		const result = await client.callTool({
			name: 'list_worlds',
			arguments: {},
		})

		const texts = (result.content as Array<{ type: string; text: string }>).map((c) => c.text)
		const allText = texts.join('\n')

		expect(result.isError).toBeUndefined()
		expect(allText).toContain('No worlds found')
	})

	it('uses provided userId in local dev mode', async () => {
		const originalEnv = process.env.REQUIRE_OAUTH
		process.env.REQUIRE_OAUTH = 'false'

		const mock = generateEndpointMock(server, {
			method: 'get',
			path: '/api/worlds',
			response: {
				ownedWorlds: [],
				contributableWorlds: [],
				visibleWorlds: [],
			},
		})

		await client.callTool({
			name: 'list_worlds',
			arguments: { userId: 'custom-user' },
		})

		expect(mock.hasBeenCalled()).toBe(true)
		expect(await ContextService.getCurrentUserId('default')).toBe('custom-user')

		process.env.REQUIRE_OAUTH = originalEnv
	})

	it('returns an error when the API call fails', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/worlds',
			error: { status: 500, message: 'Internal server error' },
		})

		const result = await client.callTool({
			name: 'list_worlds',
			arguments: {},
		})

		expect(result.isError).toBe(true)
		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('Error fetching worlds')
	})

	it('returns an error when no user is set', async () => {
		await ContextService.setCurrentUserId('default', null)

		const result = await client.callTool({
			name: 'list_worlds',
			arguments: {},
		})

		expect(result.isError).toBe(true)
		const text = (result.content as Array<{ type: string; text: string }>)[0].text
		expect(text).toContain('Error fetching worlds')
	})

	it('shows access mode in the world list', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/worlds',
			response: {
				ownedWorlds: [
					{ id: 'w1', name: 'Private World', accessMode: 'Private', calendars: [mockNumericCalendar()] },
				],
				contributableWorlds: [
					{ id: 'w2', name: 'Public World', accessMode: 'PublicEdit', calendars: [mockNumericCalendar()] },
				],
				visibleWorlds: [],
			},
		})

		const result = await client.callTool({
			name: 'list_worlds',
			arguments: {},
		})

		const texts = (result.content as Array<{ type: string; text: string }>).map((c) => c.text)
		const allText = texts.join('\n')

		expect(allText).toContain('Private')
		expect(allText).toContain('PublicEdit')
	})

	it('shows the calendar name and date format for each world', async () => {
		generateEndpointMock(server, {
			method: 'get',
			path: '/api/worlds',
			response: {
				ownedWorlds: [
					{ id: 'w1', name: 'My World', accessMode: 'Private', calendars: [mockNumericCalendar()] },
				],
				contributableWorlds: [],
				visibleWorlds: [],
			},
		})

		const result = await client.callTool({
			name: 'list_worlds',
			arguments: {},
		})

		const allText = (result.content as Array<{ type: string; text: string }>).map((c) => c.text).join('\n')

		expect(result.isError).toBeUndefined()
		expect(allText).toContain('Calendar: Test Calendar :: Timestamp format is "d"')
	})
})
