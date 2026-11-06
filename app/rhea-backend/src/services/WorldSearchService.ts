import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'
import { deduplicateById } from '@src/utils/deduplicateById.js'
import { z } from 'zod'

import { BaselineActor, BaselineArticle, BaselineTag, BaselineWorldEvent } from './types.js'

export const SearchModeShape = z.enum(['string_match', 'split_by_space'])
export type SearchMode = z.infer<typeof SearchModeShape>
type SearchableEntityType = 'actor' | 'event' | 'article' | 'tag'
type TimeRange = { from?: number; to?: number }

export const WorldSearchService = {
	async search({
		worldId,
		query,
		mode,
		timeRange = {},
		include,
	}: {
		worldId: string
		query: string
		mode: SearchMode
		timeRange?: TimeRange
		include: SearchableEntityType[]
	}) {
		const searchPromises = {
			actors: [] as ReturnType<typeof this.findActors>[],
			articles: [] as ReturnType<typeof this.findArticles>[],
			events: [] as ReturnType<typeof this.findEvents>[],
			tags: [] as ReturnType<typeof this.findTags>[],
		}
		const timeBoundSearch = timeRange.from !== undefined || timeRange.to !== undefined

		const queries = mode === 'string_match' ? [query] : query.split(' ')
		for (const q of queries) {
			if (include.includes('actor') && !timeBoundSearch) {
				searchPromises.actors.push(this.findActors(worldId, q))
			}
			if (include.includes('article') && !timeBoundSearch) {
				searchPromises.articles.push(this.findArticles(worldId, q))
			}
			if (include.includes('event')) {
				searchPromises.events.push(this.findEvents(worldId, q, timeRange))
			}
			if (include.includes('tag') && !timeBoundSearch) {
				searchPromises.tags.push(this.findTags(worldId, q))
			}
		}

		const foundActors = deduplicateById((await Promise.all(searchPromises.actors)).flat())
		const foundArticles = deduplicateById((await Promise.all(searchPromises.articles)).flat())
		const foundEvents = deduplicateById((await Promise.all(searchPromises.events)).flat())
		const foundTags = deduplicateById((await Promise.all(searchPromises.tags)).flat())

		return {
			actors: foundActors,
			articles: foundArticles,
			events: foundEvents,
			tags: foundTags,
		}
	},

	async findActors(worldId: string, query: string): Promise<BaselineActor[]> {
		const prisma = getPrismaClient()
		return prisma.actor.findMany({
			where: {
				worldId,
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ title: { contains: query, mode: 'insensitive' } },
					{ content: { contains: query, mode: 'insensitive' } },
					{
						pages: {
							some: {
								OR: [
									{ name: { contains: query, mode: 'insensitive' } },
									{ content: { contains: query, mode: 'insensitive' } },
								],
							},
						},
					},
				],
			},
			include: {
				mentions: {
					distinct: ['targetId'],
					select: {
						targetId: true,
						targetType: true,
					},
				},
				mentionedIn: {
					distinct: ['sourceId'],
					select: {
						sourceId: true,
						sourceType: true,
					},
				},
				pages: {
					select: {
						id: true,
						name: true,
					},
				},
				nodes: true,
			},
		})
	},

	async findArticles(worldId: string, query: string): Promise<BaselineArticle[]> {
		const prisma = getPrismaClient()
		return prisma.wikiArticle.findMany({
			where: {
				worldId,
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ content: { contains: query, mode: 'insensitive' } },
					{
						pages: {
							some: {
								OR: [
									{ name: { contains: query, mode: 'insensitive' } },
									{ content: { contains: query, mode: 'insensitive' } },
								],
							},
						},
					},
				],
			},
			include: {
				mentions: {
					distinct: ['targetId'],
					select: {
						targetId: true,
						targetType: true,
					},
				},
				mentionedIn: {
					distinct: ['sourceId'],
					select: {
						sourceId: true,
						sourceType: true,
					},
				},
				pages: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})
	},

	async findEvents(worldId: string, query: string, timeRange: TimeRange): Promise<BaselineWorldEvent[]> {
		const prisma = getPrismaClient()
		const isWildcard = query === '*'
		return prisma.worldEvent.findMany({
			where: {
				worldId,
				timestamp: {
					gte: timeRange.from === undefined ? undefined : BigInt(timeRange.from),
					lte: timeRange.to === undefined ? undefined : BigInt(timeRange.to),
				},
				OR: isWildcard
					? undefined
					: [
							{ name: { contains: query, mode: 'insensitive' } },
							{ content: { contains: query, mode: 'insensitive' } },
							{
								deltaStates: {
									some: {
										OR: [
											{ name: { contains: query, mode: 'insensitive' } },
											{ description: { contains: query, mode: 'insensitive' } },
										],
									},
								},
							},
							{
								pages: {
									some: {
										OR: [
											{ name: { contains: query, mode: 'insensitive' } },
											{ content: { contains: query, mode: 'insensitive' } },
										],
									},
								},
							},
						],
			},
			orderBy: {
				timestamp: 'asc',
			},
			include: {
				mentions: {
					distinct: ['targetId'],
					select: {
						targetId: true,
						targetType: true,
					},
				},
				mentionedIn: {
					distinct: ['sourceId'],
					select: {
						sourceId: true,
						sourceType: true,
					},
				},
				pages: {
					select: {
						id: true,
						name: true,
					},
				},
				deltaStates: {
					orderBy: {
						timestamp: 'asc',
					},
				},
			},
		})
	},

	async findTags(worldId: string, query: string): Promise<BaselineTag[]> {
		const prisma = getPrismaClient()
		return prisma.tag.findMany({
			where: {
				worldId,
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ description: { contains: query, mode: 'insensitive' } },
				],
			},
			include: {
				mentions: {
					distinct: ['targetId'],
					select: {
						targetId: true,
						targetType: true,
					},
				},
				mentionedIn: {
					distinct: ['sourceId'],
					select: {
						sourceId: true,
						sourceType: true,
					},
				},
			},
		})
	},
}
