import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createMcpSession } from '@fixtures/mcp'
import { expect, test } from '@playwright/test'

test.describe('multi-page actor mentions', () => {
	let user: Awaited<ReturnType<typeof createNewUser>>

	test.beforeEach(async ({ page }) => {
		user = await createNewUser(page)
	})

	test('keeps the entity-level link while any page still asserts it', async ({ page }) => {
		const mcp = await createMcpSession(page, user)

		const sectionStartingWith = (result: Awaited<ReturnType<typeof mcp.callTool>>, prefix: string): string =>
			result.content.find((part) => part.text.startsWith(prefix))?.text ?? ''

		expect((await mcp.callTool('create_world', { name: 'Mention World' })).isError).toBeFalsy()
		expect((await mcp.callTool('create_actor', { name: 'ZZ_Target2' })).isError).toBeFalsy()
		expect((await mcp.callTool('create_actor', { name: 'ZZ_Source2' })).isError).toBeFalsy()

		// The source body mentions the target.
		expect(
			(
				await mcp.callTool('update_entity_content', {
					entityName: 'ZZ_Source2',
					set: '<p>Linked to @[ZZ_Target2] here.</p>',
				})
			).isError,
		).toBeFalsy()

		// A sub-page of the source independently mentions the same target.
		expect(
			(
				await mcp.callTool('update_entity_content', {
					entityName: 'ZZ_Source2',
					pageName: 'SubPage',
					set: '<p>Also linked to @[ZZ_Target2] from a page.</p>',
				})
			).isError,
		).toBeFalsy()

		// Baseline: the target reports the source as a backlink...
		const baselineTarget = await mcp.callTool('get_entity_details', { entityName: 'ZZ_Target2' })
		expect(sectionStartingWith(baselineTarget, 'Mentioned in:')).toContain('ZZ_Source2')

		// ...and the source lists the target exactly once despite two pages asserting it
		// (dedup on read — the link is per-entity, not per-page).
		const baselineSource = await mcp.callTool('get_entity_details', { entityName: 'ZZ_Source2' })
		const baselineMentions = sectionStartingWith(baselineSource, 'Mentions:')
		expect(baselineMentions).toContain('ZZ_Target2')
		expect(baselineMentions.match(/ZZ_Target2/g)?.length).toBe(1)

		// Remove the mention from the body only, leaving the sub-page untouched.
		expect(
			(
				await mcp.callTool('update_entity_content', {
					entityName: 'ZZ_Source2',
					set: '<p>The body no longer links anyone.</p>',
				})
			).isError,
		).toBeFalsy()

		// The link must survive: the sub-page still mentions the target.
		const afterBodyEdit = await mcp.callTool('get_entity_details', { entityName: 'ZZ_Target2' })
		expect(sectionStartingWith(afterBodyEdit, 'Mentioned in:')).toContain('ZZ_Source2')

		// From the source side too, the union still reports the mention.
		const sourceAfterBodyEdit = await mcp.callTool('get_entity_details', { entityName: 'ZZ_Source2' })
		expect(sectionStartingWith(sourceAfterBodyEdit, 'Mentions:')).toContain('ZZ_Target2')

		// Removing it from the sub-page as well finally drops the link.
		expect(
			(
				await mcp.callTool('update_entity_content', {
					entityName: 'ZZ_Source2',
					pageName: 'SubPage',
					set: '<p>The page no longer links anyone either.</p>',
				})
			).isError,
		).toBeFalsy()

		const afterAllRemoved = await mcp.callTool('get_entity_details', { entityName: 'ZZ_Target2' })
		expect(sectionStartingWith(afterAllRemoved, 'Mentioned in:')).toContain('(None)')
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
