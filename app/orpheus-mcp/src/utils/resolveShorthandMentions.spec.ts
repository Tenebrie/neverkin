import { describe, expect, it } from 'vitest'

import { resolveShorthandMentions } from './resolveShorthandMentions.js'

type WorldData = Parameters<typeof resolveShorthandMentions>[0]['worldData']
type ArticleData = Parameters<typeof resolveShorthandMentions>[0]['articleData']

const createMockWorldData = (data: {
	actors?: { id: string; name: string }[]
	events?: { id: string; name: string }[]
	tags?: { id: string; name: string }[]
}): WorldData =>
	({
		actors: withUpdatedAt(data.actors),
		events: withUpdatedAt(data.events),
		tags: withUpdatedAt(data.tags),
	}) as unknown as WorldData

const mockWorldData = createMockWorldData({
	actors: [
		{ id: 'actor-1', name: 'Alice' },
		{ id: 'actor-2', name: 'Bob the Builder' },
	],
	events: [
		{ id: 'event-1', name: 'The Great Battle' },
		{ id: 'event-2', name: 'Peace Treaty Signing' },
	],
	tags: [
		{ id: 'tag-1', name: 'Important' },
		{ id: 'tag-2', name: 'Historical' },
	],
})

const mockArticleData = withUpdatedAt([
	{ id: 'article-1', name: 'Lore Overview' },
	{ id: 'article-2', name: 'Character Guide' },
]) as ArticleData

describe('resolveShorthandMentions', () => {
	it('resolves actor mention by exact name', async () => {
		const result = await resolveShorthandMentions({
			content: 'Mentioning @[Alice]',
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(
			'Mentioning <span data-component-props="{&quot;actor&quot;:&quot;actor-1&quot;}" data-type="mention" data-name="Alice"></span>',
		)
	})

	it('resolves actor mention by fuzzy match', async () => {
		const result = await resolveShorthandMentions({
			content: 'Mentioning @[Bob]',
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(
			'Mentioning <span data-component-props="{&quot;actor&quot;:&quot;actor-2&quot;}" data-type="mention" data-name="Bob the Builder"></span>',
		)
	})

	it('resolves event mention', async () => {
		const result = await resolveShorthandMentions({
			content: 'During @[The Great Battle]',
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(
			'During <span data-component-props="{&quot;event&quot;:&quot;event-1&quot;}" data-type="mention" data-name="The Great Battle"></span>',
		)
	})

	it('resolves tag mention', async () => {
		const result = await resolveShorthandMentions({
			content: 'This is @[Important]',
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(
			'This is <span data-component-props="{&quot;tag&quot;:&quot;tag-1&quot;}" data-type="mention" data-name="Important"></span>',
		)
	})

	it('resolves article mention', async () => {
		const result = await resolveShorthandMentions({
			content: 'See @[Lore Overview]',
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(
			'See <span data-component-props="{&quot;article&quot;:&quot;article-1&quot;}" data-type="mention" data-name="Lore Overview"></span>',
		)
	})

	it('resolves event mention inside an HTML tag', async () => {
		const result = await resolveShorthandMentions({
			content: '<p>During @[The Great Battle]</p>',
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(
			'<p>During <span data-component-props="{&quot;event&quot;:&quot;event-1&quot;}" data-type="mention" data-name="The Great Battle"></span></p>',
		)
	})

	it('resolves multiple mentions in same content', async () => {
		const result = await resolveShorthandMentions({
			content: '@[Alice] met @[Bob] at @[The Great Battle]',
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toContain('data-name="Alice"')
		expect(result).toContain('data-name="Bob the Builder"')
		expect(result).toContain('data-name="The Great Battle"')
	})

	it('does not modify content without shorthand mentions', async () => {
		const content = 'Plain text without any mentions'
		const result = await resolveShorthandMentions({
			content,
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(content)
	})

	it('does not modify existing HTML mentions', async () => {
		const existingMention =
			'<span data-component-props="{&quot;actor&quot;:&quot;existing-id&quot;}" data-type="mention" data-name="Existing"></span>'
		const result = await resolveShorthandMentions({
			content: `Already has ${existingMention}`,
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(`Already has ${existingMention}`)
	})

	it('throws error for unmatched mention', async () => {
		await expect(
			resolveShorthandMentions({
				content: 'Mentioning @[Unknown Entity]',
				worldData: mockWorldData,
				articleData: mockArticleData,
			}),
		).rejects.toThrow('Unable to resolve "Unknown Entity"')
	})

	it('resolves complex content structure', async () => {
		const content = `<h2>Head</h2><p> Paragraph</p><p> Mention is @[Lore Overview]. Post para. </p><p> Ppp </p><p></p>`

		const result = await resolveShorthandMentions({
			content,
			worldData: mockWorldData,
			articleData: mockArticleData,
		})

		expect(result).toBe(
			`<h2>Head</h2><p> Paragraph</p><p> Mention is <span data-component-props="{&quot;article&quot;:&quot;article-1&quot;}" data-type="mention" data-name="Lore Overview"></span>. Post para. </p><p> Ppp </p><p></p>`,
		)
	})

	describe('ambiguity detection and matching priority', () => {
		describe('exact match (case-insensitive, trimmed)', () => {
			it('resolves when exactly 1 exact match exists', async () => {
				const worldData = createMockWorldData({
					actors: [
						{ id: 'actor-1', name: 'John' },
						{ id: 'actor-2', name: 'Johnny Appleseed' },
					],
				})

				const result = await resolveShorthandMentions({
					content: 'Mentioning @[John]',
					worldData,
					articleData: [],
				})

				expect(result).toContain('data-name="John"')
				expect(result).toContain('&quot;actor&quot;:&quot;actor-1&quot;')
			})

			it('resolves exact match case-insensitively', async () => {
				const worldData = createMockWorldData({
					actors: [{ id: 'actor-1', name: 'Alice' }],
				})

				const result = await resolveShorthandMentions({
					content: 'Mentioning @[ALICE]',
					worldData,
					articleData: [],
				})

				expect(result).toContain('data-name="Alice"')
			})

			it('resolves exact match with trimmed whitespace', async () => {
				const worldData = createMockWorldData({
					actors: [{ id: 'actor-1', name: '  Alice  ' }],
				})

				const result = await resolveShorthandMentions({
					content: 'Mentioning @[Alice]',
					worldData,
					articleData: [],
				})

				expect(result).toContain('data-name="  Alice  "')
			})

			it('throws error when multiple exact matches exist within same entity type', async () => {
				const worldData = createMockWorldData({
					actors: [
						{ id: 'actor-1', name: 'Alice' },
						{ id: 'actor-2', name: 'ALICE' },
					],
				})

				await expect(
					resolveShorthandMentions({
						content: 'Mentioning @[Alice]',
						worldData,
						articleData: [],
					}),
				).rejects.toThrow('Ambiguous name "Alice": multiple entities found with exact name match')
			})
		})

		describe('substring/fuzzy match fallback', () => {
			it('falls back to substring match when no exact match exists', async () => {
				const worldData = createMockWorldData({
					actors: [{ id: 'actor-1', name: 'Bob the Builder' }],
				})

				const result = await resolveShorthandMentions({
					content: 'Mentioning @[Bob]',
					worldData,
					articleData: [],
				})

				expect(result).toContain('data-name="Bob the Builder"')
			})

			it('resolves when exactly 1 substring match exists', async () => {
				const worldData = createMockWorldData({
					actors: [
						{ id: 'actor-1', name: 'The Great Wizard' },
						{ id: 'actor-2', name: 'Warrior King' },
					],
				})

				const result = await resolveShorthandMentions({
					content: 'Mentioning @[Wizard]',
					worldData,
					articleData: [],
				})

				expect(result).toContain('data-name="The Great Wizard"')
			})

			it('throws error when multiple substring matches exist', async () => {
				const worldData = createMockWorldData({
					actors: [
						{ id: 'actor-1', name: 'John the Brave' },
						{ id: 'actor-2', name: 'John the Wise' },
					],
				})

				await expect(
					resolveShorthandMentions({
						content: 'Mentioning @[John]',
						worldData,
						articleData: [],
					}),
				).rejects.toThrow('Ambiguous name "John": multiple entities found with fuzzy match')
			})
		})

		describe('no match scenarios', () => {
			it('throws error when no match exists at all', async () => {
				const worldData = createMockWorldData({
					actors: [{ id: 'actor-1', name: 'Alice' }],
				})

				await expect(
					resolveShorthandMentions({
						content: 'Mentioning @[Zephyr]',
						worldData,
						articleData: [],
					}),
				).rejects.toThrow('Unable to resolve "Zephyr"')
			})

			it('throws error when entity exists but not as substring', async () => {
				const worldData = createMockWorldData({
					actors: [{ id: 'actor-1', name: 'Alice' }],
				})

				await expect(
					resolveShorthandMentions({
						content: 'Mentioning @[Bob]',
						worldData,
						articleData: [],
					}),
				).rejects.toThrow('Unable to resolve "Bob"')
			})
		})

		describe('cross-entity-type ambiguity', () => {
			it('throws error when same name matches across different entity types', async () => {
				const worldData = createMockWorldData({
					actors: [{ id: 'actor-1', name: 'Phoenix' }],
					events: [{ id: 'event-1', name: 'Phoenix' }],
				})

				await expect(
					resolveShorthandMentions({
						content: 'Mentioning @[Phoenix]',
						worldData,
						articleData: [],
					}),
				).rejects.toThrow('Ambiguous name "Phoenix": multiple entities found with exact name match')
			})

			it('throws error when fuzzy match hits across different entity types', async () => {
				const worldData = createMockWorldData({
					actors: [{ id: 'actor-1', name: 'The Phoenix Rises' }],
					tags: [{ id: 'tag-1', name: 'Phoenix Era' }],
				})

				await expect(
					resolveShorthandMentions({
						content: 'Mentioning @[Phoenix]',
						worldData,
						articleData: [],
					}),
				).rejects.toThrow('Ambiguous name "Phoenix": multiple entities found with fuzzy match')
			})
		})

		describe('exact match takes priority over fuzzy', () => {
			it('prefers exact match over fuzzy match in same entity type', async () => {
				const worldData = createMockWorldData({
					actors: [
						{ id: 'actor-1', name: 'Alice' },
						{ id: 'actor-2', name: 'Alice in Wonderland' },
					],
				})

				const result = await resolveShorthandMentions({
					content: 'Mentioning @[Alice]',
					worldData,
					articleData: [],
				})

				expect(result).toContain('data-name="Alice"')
				expect(result).toContain('&quot;actor&quot;:&quot;actor-1&quot;')
				expect(result).not.toContain('actor-2')
			})

			it('prefers exact match even when fuzzy matches exist in other entity types', async () => {
				const worldData = createMockWorldData({
					actors: [{ id: 'actor-1', name: 'Phoenix' }],
					events: [{ id: 'event-1', name: 'Rise of the Phoenix' }],
				})

				const result = await resolveShorthandMentions({
					content: 'Mentioning @[Phoenix]',
					worldData,
					articleData: [],
				})

				expect(result).toContain('data-name="Phoenix"')
				expect(result).toContain('&quot;actor&quot;:&quot;actor-1&quot;')
			})
		})
	})
})

function withUpdatedAt(entities: { id: string; name: string }[] = []) {
	return entities.map((entity) => ({ ...entity, updatedAt: '2026-01-01T00:00:00.000Z' }))
}
