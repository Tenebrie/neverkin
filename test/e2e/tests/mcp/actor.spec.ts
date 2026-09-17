import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createMcpSession } from '@fixtures/mcp'
import { expect, test } from '@playwright/test'

test.describe('MCP Actor Tools', () => {
	let user: Awaited<ReturnType<typeof createNewUser>>

	test.beforeEach(async ({ page }) => {
		user = await createNewUser(page)
	})

	test('creates an actor with description and reads it back', async ({ page }) => {
		const mcp = await createMcpSession(page, user)

		// Create a world (automatically sets context)
		const createWorldResult = await mcp.callTool('create_world', { name: 'Actor World' })
		expect(createWorldResult.isError).toBeFalsy()

		// Create an actor with title and description
		const createResult = await mcp.callTool('create_actor', {
			name: 'Gandalf',
			title: 'The Grey',
			description: '<p>A wandering wizard of great power.</p>',
		})
		expect(createResult.isError).toBeFalsy()
		expect(createResult.content[0].text).toContain('Gandalf')
		expect(createResult.content[0].text).toContain('The Grey')

		// Read the actor back and verify content is persisted
		const detailsResult = await mcp.callTool('get_entity_details', {
			entityName: 'Gandalf',
		})
		expect(detailsResult.isError).toBeFalsy()
		const detailsText = detailsResult.content[0].text
		expect(detailsText).toContain('Gandalf')
		expect(detailsText).toContain('The Grey')
		expect(detailsText).toContain('A wandering wizard of great power.')
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
