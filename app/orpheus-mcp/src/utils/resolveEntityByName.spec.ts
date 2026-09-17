import { mockEntityArticles, mockEntityWorld } from '@src/test-utils/mockEntityWorld.js'
import { describe, expect, it } from 'vitest'

import { CONTENT_ENTITY_TYPES, MENTIONABLE_ENTITY_TYPES, resolveEntityByName } from './resolveEntityByName.js'

type WorldData = Parameters<typeof resolveEntityByName>[0]['worldData']
type ArticleData = Parameters<typeof resolveEntityByName>[0]['articleData']

const worldData = mockEntityWorld as unknown as WorldData
const articleData = mockEntityArticles as unknown as ArticleData

describe('resolveEntityByName', () => {
	it('resolves an exact match across types', () => {
		const resolved = resolveEntityByName({
			name: 'magic system',
			types: CONTENT_ENTITY_TYPES,
			worldData,
			articleData,
		})
		expect(resolved.type).toBe('article')
		expect(resolved.entity.id).toBe('art-1')
	})

	it('resolves a unique fuzzy match', () => {
		const resolved = resolveEntityByName({
			name: 'dragon',
			types: CONTENT_ENTITY_TYPES,
			worldData,
			articleData,
		})
		expect(resolved.type).toBe('event')
	})

	it('throws when an exact name exists in several types', () => {
		expect(() =>
			resolveEntityByName({ name: 'Phoenix', types: CONTENT_ENTITY_TYPES, worldData, articleData }),
		).toThrow(
			'Ambiguous name "Phoenix": multiple entities found with exact name match: actor "Phoenix", article "Phoenix"',
		)
	})

	it('throws when a fuzzy name matches several entities', () => {
		expect(() =>
			resolveEntityByName({ name: 'a', types: CONTENT_ENTITY_TYPES, worldData, articleData }),
		).toThrow('multiple entities found with fuzzy match')
	})

	it('narrows the search to the given types', () => {
		const resolved = resolveEntityByName({ name: 'Phoenix', types: ['article'], worldData, articleData })
		expect(resolved.entity.id).toBe('art-2')
	})

	it('lists recently updated entities of the searched types when nothing matches', () => {
		expect(() =>
			resolveEntityByName({ name: 'Nonexistent', types: ['actor', 'event'], worldData, articleData }),
		).toThrow(
			'Unable to resolve "Nonexistent": no matching entity found in actor, event. Recently updated: event "Dragon Attack", actor "Gandalf", actor "Phoenix"',
		)
	})

	it('caps the recently updated list', () => {
		const actors = Array.from({ length: 40 }, (_, i) => ({
			id: `a${i}`,
			name: `Actor ${i}`,
			updatedAt: `2026-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
		}))
		const bigWorld = { ...mockEntityWorld, actors, events: [] } as unknown as WorldData

		expect(() =>
			resolveEntityByName({
				name: 'Nonexistent',
				types: MENTIONABLE_ENTITY_TYPES,
				worldData: bigWorld,
				articleData: [],
			}),
		).toThrow(/Recently updated: actor "Actor 39", (actor "Actor \d+", ){28}actor "Actor 10"$/)
	})

	it('says none when the searched types are empty', () => {
		expect(() =>
			resolveEntityByName({ name: 'Nonexistent', types: ['tag'], worldData, articleData }),
		).toThrow('Recently updated: (none)')
	})
})
