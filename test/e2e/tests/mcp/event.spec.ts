import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createMcpSession } from '@fixtures/mcp'
import { expect, test } from '@playwright/test'

test.describe('MCP Event Tools', () => {
	let user: Awaited<ReturnType<typeof createNewUser>>

	test.beforeEach(async ({ page }) => {
		user = await createNewUser(page)
	})

	test('creates an event with description and reads it back', async ({ page }) => {
		const mcp = await createMcpSession(page, user)

		// Create a world (automatically sets context)
		const createWorldResult = await mcp.callTool('create_world', { name: 'Event World' })
		expect(createWorldResult.isError).toBeFalsy()

		// Create an event with a date/time (in the world calendar's format) and description
		const eventTimestamp = '14:40 June 15, 1999'
		const createResult = await mcp.callTool('create_entities', {
			entities: [
				{
					type: 'event',
					name: 'The Great Battle',
					timestamp: eventTimestamp,
					content: '<p>A decisive battle that changed the course of history.</p>',
				},
			],
		})
		expect(createResult.isError).toBeFalsy()
		expect(createResult.content[0].text).toContain('The Great Battle')

		// Read the event back and verify the date/time and content are persisted
		const detailsResult = await mcp.callTool('get_entity_details', {
			entityName: 'The Great Battle',
		})
		expect(detailsResult.isError).toBeFalsy()
		const detailsText = detailsResult.content[0].text
		expect(detailsText).toContain('The Great Battle')
		expect(detailsText).toContain(eventTimestamp)
		expect(detailsText).toContain('A decisive battle that changed the course of history.')
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
