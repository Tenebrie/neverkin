import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EntityResolverService } from './EntityResolverService.js'
import { MentionNodeContent, RichTextService } from './RichTextService.js'

const toHtmlAttribute = (mention: MentionNodeContent): string => {
	return JSON.stringify(mention).replace(/"/g, '&quot;')
}

describe('RichTextService', () => {
	beforeEach(() => {
		vi.spyOn(RichTextService, 'isMentionValid').mockResolvedValue(true)
	})

	it('parses plain text correctly', async () => {
		const contentString = 'Plain non-html text'
		const result = await RichTextService.parseContentString({ worldId: 'test-world', contentString })

		expect(result.content).toBe('Plain non-html text')
		expect(result.contentRich).toBe(contentString)
		expect(result.mentions).toEqual([])
	})

	it('parses simple markup correctly', async () => {
		const contentString = '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>'
		const result = await RichTextService.parseContentString({ worldId: 'test-world', contentString })

		expect(result.content).toBe('This is bold and italic text.')
		expect(result.contentRich).toBe(contentString)
		expect(result.mentions).toEqual([])
	})

	it('resolves actor name in plain text correctly', async () => {
		vi.spyOn(EntityResolverService, 'resolveEntityName').mockImplementation(
			async ({ entityType, entityId }) => {
				if (entityType === 'actor' && entityId === '00000000') {
					return 'Named Actor'
				}
				return ''
			},
		)

		const mention: MentionNodeContent = {
			actor: '00000000',
			event: false,
			article: false,
			tag: false,
		}
		const contentString = `Mentions <span data-component-props="${toHtmlAttribute(mention)}"></span>`
		const result = await RichTextService.parseContentString({ worldId: 'test-world', contentString })

		expect(result.content).toBe('Mentions Named Actor')
		expect(result.mentions).toEqual([
			{
				targetId: '00000000',
				targetType: 'Actor',
			},
		])
	})

	it('silently excludes invalid mentions', async () => {
		vi.spyOn(EntityResolverService, 'resolveEntityName').mockImplementation(
			async ({ entityType, entityId }) => {
				if (entityType === 'actor' && entityId === '00000001') {
					return 'Named Actor'
				} else if (entityType === 'actor') {
					return 'Unknown Actor'
				}
				return ''
			},
		)
		vi.spyOn(RichTextService, 'isMentionValid').mockResolvedValueOnce(false).mockResolvedValueOnce(true)

		const mentionA: MentionNodeContent = {
			actor: '00000000',
		}
		const mentionB: MentionNodeContent = {
			actor: '00000001',
		}
		const contentString = `Mentions <span data-component-props="${toHtmlAttribute(mentionA)}"></span> and <span data-component-props="${toHtmlAttribute(mentionB)}"></span>`
		const result = await RichTextService.parseContentString({ worldId: 'test-world', contentString })

		expect(result.content).toBe('Mentions Unknown Actor and Named Actor')
		expect(result.mentions).toEqual([
			{
				targetId: '00000001',
				targetType: 'Actor',
			},
		])
	})

	it('resolves article name in plain text correctly', async () => {
		vi.spyOn(EntityResolverService, 'resolveEntityName').mockImplementation(
			async ({ entityType, entityId }) => {
				if (entityType === 'article' && entityId === '00000000') {
					return 'Named Article'
				}
				return ''
			},
		)

		const mention: MentionNodeContent = {
			actor: false,
			event: false,
			article: '00000000',
			tag: false,
		}
		const contentString = `Mentions <span data-component-props="${toHtmlAttribute(mention)}"></span>`
		const result = await RichTextService.parseContentString({ worldId: 'test-world', contentString })

		expect(result.content).toBe('Mentions Named Article')
		expect(result.mentions).toEqual([
			{
				targetId: '00000000',
				targetType: 'Article',
			},
		])
	})

	it('resolves event name in plain text correctly', async () => {
		vi.spyOn(EntityResolverService, 'resolveEntityName').mockImplementation(
			async ({ entityType, entityId }) => {
				if (entityType === 'event' && entityId === '00000000') {
					return 'Named Event'
				}
				return ''
			},
		)

		const mention: MentionNodeContent = {
			actor: false,
			event: '00000000',
			article: false,
			tag: false,
		}
		const contentString = `Mentions <span data-component-props="${toHtmlAttribute(mention)}"></span>`
		const result = await RichTextService.parseContentString({ worldId: 'test-world', contentString })

		expect(result.content).toBe('Mentions Named Event')
		expect(result.mentions).toEqual([
			{
				targetId: '00000000',
				targetType: 'Event',
			},
		])
	})

	it('parses content strings correctly from a real world example', async () => {
		vi.spyOn(EntityResolverService, 'resolveEntityName').mockImplementation(
			async ({ entityType, entityId }) => {
				if (entityType === 'actor' && entityId === 'd0f1c21a-a584-4153-8408-c0b5f60516c7') {
					return 'Actor name'
				} else if (entityType === 'event' && entityId === '4942295e-6e25-4b05-9764-5b22b8983c3f') {
					return 'This is an example text'
				} else if (entityType === 'article' && entityId === '600dff9d-c31c-4c07-addb-37e16f6db7b2') {
					return 'New Article'
				}
				return ''
			},
		)

		const contentString =
			'<p>This is an example text</p><p>This is the target to find: <span data-component-props="{&quot;actor&quot;:&quot;d0f1c21a-a584-4153-8408-c0b5f60516c7&quot;,&quot;event&quot;:false,&quot;article&quot;:false}"></span> </p><p>It\'s called a mention, and we need to parse them.</p><p><span data-component-props="{&quot;actor&quot;:false,&quot;event&quot;:&quot;4942295e-6e25-4b05-9764-5b22b8983c3f&quot;,&quot;article&quot;:false}"></span> </p><p><span data-component-props="{&quot;actor&quot;:false,&quot;event&quot;:false,&quot;article&quot;:&quot;600dff9d-c31c-4c07-addb-37e16f6db7b2&quot;}"></span> </p>'

		const result = await RichTextService.parseContentString({ worldId: 'test-world', contentString })

		expect(result.content).toBe(
			"This is an example text\n\nThis is the target to find: Actor name \n\nIt's called a mention, and we need to parse them.\n\nThis is an example text \n\nNew Article",
		)
		expect(result.contentRich).toBe(contentString)

		expect(result.mentions).toEqual([
			{
				targetId: 'd0f1c21a-a584-4153-8408-c0b5f60516c7',
				targetType: 'Actor',
			},
			{
				targetId: '4942295e-6e25-4b05-9764-5b22b8983c3f',
				targetType: 'Event',
			},
			{
				targetId: '600dff9d-c31c-4c07-addb-37e16f6db7b2',
				targetType: 'Article',
			},
		])
	})
})
