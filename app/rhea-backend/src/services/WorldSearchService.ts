import { WorldSearchEntry } from '@prisma/client'
import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'
import { deduplicateById } from '@src/utils/deduplicateById.js'
import { z } from 'zod'

import { BaselineActor, BaselineArticle, BaselineTag, BaselineWorldEvent } from './types.js'

export const SearchModeShape = z.enum(['string_match', 'split_by_space'])
export type SearchMode = z.infer<typeof SearchModeShape>
type SearchableEntityType = 'actor' | 'event' | 'article' | 'tag'
type TimeRange = { from?: number; to?: number }
type SearchParams = {
	skip: number
	take: number
}

export const WorldSearchService = {
	async autocompleteSearch({
		worldIds,
		query,
		mode,
		take,
		skip,
	}: {
		worldIds: string[]
		query: string
		mode: SearchMode
		take?: number
		skip?: number
	}) {
		const prisma = getPrismaClient()

		const rawTerms = mode === 'string_match' ? [query] : query.split(/\s+/)
		const terms = rawTerms.filter((term) => term.length >= 3)
		if (terms.length === 0) {
			return { hits: [], worlds: [] }
		}

		const hits = await prisma.worldSearchEntry.findMany({
			where: {
				worldId: {
					in: worldIds,
				},
				OR: terms.flatMap((term) => [
					{ name: { contains: term, mode: 'insensitive' } },
					{ title: { contains: term, mode: 'insensitive' } },
					{ content: { contains: term, mode: 'insensitive' } },
				]),
			},
			orderBy: {
				updatedAt: 'desc',
			},
		})

		const entityHits = hits.filter((hit) => !hit.pageId)
		const pageHits = hits.filter((hit) => hit.pageId)

		const missingParentIds = pageHits
			.map((page) => page.entityId)
			.filter((id) => !entityHits.some((hit) => hit.entityId === id))

		const missingParents = await prisma.worldSearchEntry.findMany({
			where: {
				entityId: { in: missingParentIds },
				worldId: { in: worldIds },
				pageId: null,
			},
		})

		const allHits = [...entityHits, ...missingParents]
			.map((entity) => ({
				...entity,
				pages: pageHits.filter((page) => page.entityId === entity.entityId),
			}))
			.map((entity) => ({
				...entity,
				totalRelevance: (() => {
					const selfRelevance = WorldSearchService.getHitRelevance(entity, terms)
					const pagesRelevance = entity.pages.reduce(
						(total, current) => (total += WorldSearchService.getHitRelevance(current, terms)),
						0,
					)
					return selfRelevance + pagesRelevance
				})(),
			}))
			.sort((a, b) => {
				return b.totalRelevance - a.totalRelevance || b.updatedAt.getTime() - a.updatedAt.getTime()
			})

		const worlds = [
			...allHits
				.reduce((map, hit) => {
					const world = map.get(hit.worldId) ?? { id: hit.worldId, relevance: 0 }
					world.relevance += hit.totalRelevance
					return map.set(hit.worldId, world)
				}, new Map<string, { id: string; relevance: number }>())
				.values(),
		]
			.sort((a, b) => b.relevance - a.relevance)
			.map((world) => ({
				...world,
				relevance: undefined,
			}))

		const cleanHits = allHits
			.map((entity) => ({
				...entity,
				totalRelevance: undefined,
			}))
			.slice(skip ?? 0, (skip ?? 0) + (take ?? 5))

		return { hits: cleanHits, worlds }
	},

	getHitRelevance(entity: WorldSearchEntry, terms: string[]) {
		return terms.reduce((total, current) => {
			const term = current.toLowerCase()
			const nameHit = entity.name.toLowerCase().includes(term) ? 1 : 0
			const titleHit = entity.title?.toLowerCase().includes(term) ? 1 : 0
			const contentHits = entity.content.toLowerCase().split(term).length - 1
			const entityAgeMinutes = (Date.now() - entity.updatedAt.getTime()) / 60_000
			const entityAgePenalty = Math.log1p(entityAgeMinutes / 2) / Math.log(6)
			return total + nameHit * 20 + titleHit * 20 + contentHits - entityAgePenalty
		}, 0)
	},

	async detailedSearch({
		worldIds,
		query,
		mode,
		timeRange = {},
		include,
		take,
		skip,
	}: {
		worldIds: string[]
		query: string
		mode: SearchMode
		timeRange?: TimeRange
		include: SearchableEntityType[]
		take?: number
		skip?: number
	}) {
		const searchPromises = {
			actors: [] as ReturnType<typeof this.findActors>[],
			articles: [] as ReturnType<typeof this.findArticles>[],
			events: [] as ReturnType<typeof this.findEvents>[],
			tags: [] as ReturnType<typeof this.findTags>[],
		}
		const timeBoundSearch = timeRange.from !== undefined || timeRange.to !== undefined

		const queries = mode === 'string_match' ? [query] : query.split(' ')

		const params: SearchParams = {
			take: take ?? 100,
			skip: skip ?? 0,
		}

		for (const q of queries) {
			if (include.includes('actor') && !timeBoundSearch) {
				searchPromises.actors.push(this.findActors(worldIds, q, params))
			}
			if (include.includes('article') && !timeBoundSearch) {
				searchPromises.articles.push(this.findArticles(worldIds, q, params))
			}
			if (include.includes('event')) {
				searchPromises.events.push(this.findEvents(worldIds, q, params, timeRange))
			}
			if (include.includes('tag') && !timeBoundSearch) {
				searchPromises.tags.push(this.findTags(worldIds, q, params))
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

	async findActors(worldIds: string[], query: string, params: SearchParams): Promise<BaselineActor[]> {
		const prisma = getPrismaClient()
		return prisma.actor.findMany({
			...params,
			where: {
				worldId: {
					in: worldIds,
				},
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

	async findArticles(worldIds: string[], query: string, params: SearchParams): Promise<BaselineArticle[]> {
		const prisma = getPrismaClient()
		return prisma.wikiArticle.findMany({
			...params,
			where: {
				worldId: {
					in: worldIds,
				},
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

	async findEvents(
		worldIds: string[],
		query: string,
		params: SearchParams,
		timeRange: TimeRange,
	): Promise<BaselineWorldEvent[]> {
		const prisma = getPrismaClient()
		const isWildcard = query === '*'
		return prisma.worldEvent.findMany({
			...params,
			where: {
				worldId: {
					in: worldIds,
				},
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
			},
		})
	},

	async findTags(worldIds: string[], query: string, params: SearchParams): Promise<BaselineTag[]> {
		const prisma = getPrismaClient()
		return prisma.tag.findMany({
			...params,
			where: {
				worldId: {
					in: worldIds,
				},
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
