import { PrismaClient } from '@prisma/client'
import { mockUser, mockWorld } from '@src/mock/index.js'
import { setupMockDatabase } from '@src/mock/utils/setupMockDatabase.js'
import { beforeEach, describe, expect, it } from 'vitest'

import { WorldSearchService } from './WorldSearchService.js'

describe('WorldSearchService', () => {
	const db = setupMockDatabase()
	const user = mockUser()
	const world = mockWorld({ ownerId: user.id })

	beforeEach(async () => {
		await db.user.create({ data: user })
		await db.world.create({ data: world })
	})

	it('gracefully resolves empty results', async () => {
		const result = WorldSearchService.search({
			worldIds: [world.id],
			query: 'test',
			mode: 'string_match',
			include: ['actor', 'article', 'event', 'tag'],
		})
		await expect(result).resolves.toEqual({
			actors: [],
			articles: [],
			events: [],
			tags: [],
		})
	})

	it('finds all matching entities with full string match', async () => {
		await createEntities(db, world.id, ['not a partially matching entity', 'partial, but not a match'])

		const result = WorldSearchService.search({
			worldIds: [world.id],
			query: 'not a partial',
			mode: 'string_match',
			include: ['actor', 'article', 'event', 'tag'],
		})
		await expect(result).resolves.toEqual({
			actors: [expect.objectContaining({ name: 'not a partially matching entity' })],
			articles: [expect.objectContaining({ name: 'not a partially matching entity' })],
			events: [expect.objectContaining({ name: 'not a partially matching entity' })],
			tags: [expect.objectContaining({ name: 'not a partially matching entity' })],
		})
	})

	it('searches for each part separately with split_by_space mode', async () => {
		await createEntities(db, world.id, ['first query', 'second query', 'third query'])

		const result = WorldSearchService.search({
			worldIds: [world.id],
			query: 'first second',
			mode: 'split_by_space',
			include: ['actor', 'article', 'event', 'tag'],
		})
		await expect(result).resolves.toEqual({
			actors: [
				expect.objectContaining({ name: 'first query' }),
				expect.objectContaining({ name: 'second query' }),
			],
			articles: [
				expect.objectContaining({ name: 'first query' }),
				expect.objectContaining({ name: 'second query' }),
			],
			events: [
				expect.objectContaining({ name: 'first query' }),
				expect.objectContaining({ name: 'second query' }),
			],
			tags: [
				expect.objectContaining({ name: 'first query' }),
				expect.objectContaining({ name: 'second query' }),
			],
		})
	})

	it('deduplicates results based on entity id', async () => {
		await createEntities(db, world.id, ['first second'])

		const result = WorldSearchService.search({
			worldIds: [world.id],
			query: 'first second',
			mode: 'split_by_space',
			include: ['actor', 'article', 'event', 'tag'],
		})
		await expect(result).resolves.toEqual({
			actors: [expect.objectContaining({ name: 'first second' })],
			articles: [expect.objectContaining({ name: 'first second' })],
			events: [expect.objectContaining({ name: 'first second' })],
			tags: [expect.objectContaining({ name: 'first second' })],
		})
	})

	// it('respects pagination settings', async () => {
	// 	await createEntities(db, world.id, ['query 1', 'query 2', 'query 3', 'query 4', 'query 5'])

	// 	const result = await WorldSearchService.search({
	// 		worldIds: [world.id],
	// 		query: 'query',
	// 		mode: 'string_match',
	// 		include: ['actor', 'article', 'event', 'tag'],
	// 		skip: 1,
	// 		take: 3,
	// 	})
	// 	expect(result.actors).toHaveLength(3)
	// 	expect(result.articles).toHaveLength(3)
	// 	expect(result.tags).toHaveLength(3)
	// 	expect(result.events.map((event) => event.name)).toEqual(['query 2', 'query 3', 'query 4'])
	// })
})

async function createEntities(db: PrismaClient, worldId: string, names: string[]) {
	const data = names.map((name) => ({ worldId, name }))
	await db.actor.createMany({ data })
	await db.wikiArticle.createMany({ data })
	await db.worldEvent.createMany({
		data: names.map((name, index) => ({ worldId, name, timestamp: BigInt(index) })),
	})
	await db.tag.createMany({ data })
}
