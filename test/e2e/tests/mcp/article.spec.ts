import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createMcpSession } from '@fixtures/mcp'
import { expect, test } from '@playwright/test'

test.describe('MCP Article Tools', () => {
	let user: Awaited<ReturnType<typeof createNewUser>>

	test.beforeEach(async ({ page }) => {
		user = await createNewUser(page)
	})

	test('creates an article with content and reads it back', async ({ page }) => {
		const mcp = await createMcpSession(page, user)

		// Create a world (automatically sets context)
		const createWorldResult = await mcp.callTool('create_world', { name: 'Lore World' })
		expect(createWorldResult.isError).toBeFalsy()
		expect(createWorldResult.content[0].text).toContain('Lore World')

		// Create an article with content
		const createResult = await mcp.callTool('create_entities', {
			entities: [
				{
					type: 'article',
					name: 'Magic System',
					content: '<p>Ancient knowledge of the arcane forces.</p>',
				},
			],
		})
		expect(createResult.isError).toBeFalsy()
		expect(createResult.content[0].text).toContain('Magic System')

		// Read the article back and verify content is persisted
		const detailsResult = await mcp.callTool('get_entity_details', {
			entityName: 'Magic System',
		})
		expect(detailsResult.isError).toBeFalsy()
		const detailsText = detailsResult.content[0].text
		expect(detailsText).toContain('Magic System')
		expect(detailsText).toContain('Ancient knowledge of the arcane forces.')
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
