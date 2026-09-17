import { Client } from '@modelcontextprotocol/sdk/client'
import { setupMockClient } from '@src/test-utils/setupMockClient.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { registerReadmeTool } from './readme.tool.js'

describe('readme tool', () => {
	let client: Client

	beforeEach(async () => {
		client = await setupMockClient((server) => {
			registerReadmeTool(server)
		})
	})

	it('returns usage instructions', async () => {
		const result = await client.callTool({
			name: 'readme',
			arguments: {},
		})

		const texts = (result.content as Array<{ type: string; text: string }>).map((c) => c.text)
		const allText = texts.join('\n')

		expect(allText).toContain('Basic overview')
		expect(allText).toContain('Getting started')
		expect(allText).toContain('Main tools')
	})

	it('mentions key entity types', async () => {
		const result = await client.callTool({
			name: 'readme',
			arguments: {},
		})

		const texts = (result.content as Array<{ type: string; text: string }>).map((c) => c.text)
		const allText = texts.join('\n')

		expect(allText).toContain('Worlds')
		expect(allText).toContain('Actors')
		expect(allText).toContain('Events')
		expect(allText).toContain('Articles')
		expect(allText).toContain('Tags')
	})

	it('mentions core tools by name', async () => {
		const result = await client.callTool({
			name: 'readme',
			arguments: {},
		})

		const texts = (result.content as Array<{ type: string; text: string }>).map((c) => c.text)
		const allText = texts.join('\n')

		expect(allText).toContain('list_worlds')
		expect(allText).toContain('set_context')
		expect(allText).toContain('get_world_details')
		expect(allText).toContain('search_world')
		expect(allText).toContain('get_entity_details')
		expect(allText).toContain('update_entity_content')
	})

	it('does not return an error', async () => {
		const result = await client.callTool({
			name: 'readme',
			arguments: {},
		})

		expect(result.isError).toBeUndefined()
	})

	it('returns text content blocks', async () => {
		const result = await client.callTool({
			name: 'readme',
			arguments: {},
		})

		const content = result.content as Array<{ type: string; text: string }>
		expect(content.length).toBeGreaterThan(0)
		content.forEach((block) => {
			expect(block.type).toBe('text')
			expect(typeof block.text).toBe('string')
		})
	})
})
