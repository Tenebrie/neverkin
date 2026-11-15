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
type SearchTermWithRarity = {
	term: string
	rarity: number
}
type SearchTerms = {
	terms: SearchTermWithRarity[]
	groups: SearchTermWithRarity[]
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

		const rawTerms = mode === 'string_match' ? [query] : query.trim().split(/\s+/)
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

		const termsWithRarity = WorldSearchService.getSearchTerms(hits, terms, rawTerms)

		const allHits = [...entityHits, ...missingParents]
			.map((entity) => ({
				...entity,
				pages: pageHits.filter((page) => page.entityId === entity.entityId),
			}))
			.map((entity) => ({
				...entity,
				totalRelevance: (() => {
					const selfRelevance = WorldSearchService.getHitRelevance(entity, termsWithRarity)
					if (entity.pages.length === 0) {
						return selfRelevance
					}

					const mostRelevantPage = entity.pages.map((page) =>
						WorldSearchService.getHitRelevance(page, termsWithRarity),
					)

					return Math.max(selfRelevance, ...mostRelevantPage)
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

	getSearchTerms(hits: WorldSearchEntry[], terms: string[], rawTerms: string[]): SearchTerms {
		const textEntries = hits.map((hit) => [hit.name, hit.title ?? '', hit.content].join('\n').toLowerCase())

		const termsWithRarity = terms.map((term) => ({
			term: term.toLowerCase(),
			rarity: WorldSearchService.getTermRarity(textEntries, term.toLowerCase()),
		}))

		const termGroups = rawTerms
			.map((_, start) => rawTerms.slice(start))
			.flatMap((tail) => tail.map((_, end) => tail.slice(0, end + 1)))
			.filter((group) => group.length > 1)
			.map((group) => group.join(' ').toLowerCase())
			.map((group) => ({
				term: group,
				rarity: WorldSearchService.getTermRarity(textEntries, group),
			}))

		return {
			terms: termsWithRarity,
			groups: termGroups,
		}
	},

	getTermRarity(textEntries: string[], term: string) {
		const occurrences = textEntries.filter((text) => text.includes(term)).length
		return Math.log(1 + textEntries.length / (1 + occurrences))
	},

	getHitRelevance(entity: WorldSearchEntry, { terms, groups }: SearchTerms) {
		const entityAgeMinutes = (Date.now() - entity.updatedAt.getTime()) / 60_000
		const entityAgePenalty = Math.log1p(entityAgeMinutes / 2) / Math.log(6)
		if (terms.length === 0) {
			return -entityAgePenalty
		}

		const name = entity.name.toLowerCase()
		const title = entity.title?.toLowerCase() ?? ''
		const content = entity.content.toLowerCase()

		function rankTerm(current: SearchTermWithRarity) {
			const term = current.term.toLowerCase()
			const nameHits = Math.log1p(name.split(term).length - 1)
			const titleHits = Math.log1p(title.split(term).length - 1)
			const contentHits = Math.log1p(content.split(term).length - 1)
			const termLengthMultiplier = Math.log1p(term.length)
			return {
				score: (nameHits * 20 + titleHits * 20 + contentHits) * termLengthMultiplier * current.rarity,
				hasHits: nameHits > 0 || titleHits > 0 || contentHits > 0,
			}
		}

		const perTermMatches = terms.map(rankTerm)
		const perGroupMatches = groups.map(rankTerm)

		const termsScore = perTermMatches.reduce((total, current) => total + current.score, 0)
		const termGroupsScore = perGroupMatches.reduce((total, current) => total + current.score, 0)
		const matchedTerms = perTermMatches.reduce((total, current) => total + (current.hasHits ? 1 : 0), 0)
		const matchedTermsFraction = matchedTerms / terms.length

		return (termsScore + termGroupsScore) * matchedTermsFraction - entityAgePenalty
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
