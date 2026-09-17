import { RheaService } from '@src/services/RheaService.js'

import { nameMatchesExactly, nameMatchesFuzzy } from './findByName.js'

type WorldData = Awaited<ReturnType<typeof RheaService.getWorldDetails>>
type ArticleData = Awaited<ReturnType<typeof RheaService.getWorldArticles>>

export type ResolvedEntity =
	| { type: 'actor'; entity: WorldData['actors'][number] }
	| { type: 'event'; entity: WorldData['events'][number] }
	| { type: 'article'; entity: ArticleData[number] }
	| { type: 'tag'; entity: WorldData['tags'][number] }

export type EntityType = ResolvedEntity['type']

export const CONTENT_ENTITY_TYPES = ['actor', 'event', 'article'] as const
export const MENTIONABLE_ENTITY_TYPES = [...CONTENT_ENTITY_TYPES, 'tag'] as const

export function resolveEntityByName<T extends EntityType>({
	name,
	types,
	worldData,
	articleData,
}: {
	name: string
	types: readonly T[]
	worldData: WorldData
	articleData: ArticleData
}): Extract<ResolvedEntity, { type: T }> {
	const candidates: ResolvedEntity[] = [
		...worldData.actors.map((entity) => ({ type: 'actor' as const, entity })),
		...worldData.events.map((entity) => ({ type: 'event' as const, entity })),
		...articleData.map((entity) => ({ type: 'article' as const, entity })),
		...worldData.tags.map((entity) => ({ type: 'tag' as const, entity })),
	]
	const inScope = candidates.filter((candidate): candidate is Extract<ResolvedEntity, { type: T }> =>
		types.some((type) => type === candidate.type),
	)

	const exact = inScope.filter((c) => nameMatchesExactly({ query: name, entityName: c.entity.name }))
	if (exact.length === 1) {
		return exact[0]
	}
	if (exact.length > 1) {
		throw new Error(
			`Ambiguous name "${name}": multiple entities found with exact name match: ${describe(exact)}. Use a more specific name or specify the entity type.`,
		)
	}

	const fuzzy = inScope.filter((c) => nameMatchesFuzzy({ query: name, entityName: c.entity.name }))
	if (fuzzy.length === 1) {
		return fuzzy[0]
	}
	if (fuzzy.length > 1) {
		throw new Error(
			`Ambiguous name "${name}": multiple entities found with fuzzy match: ${describe(fuzzy)}. Use a more specific name or specify the entity type.`,
		)
	}

	throw new Error(
		`Unable to resolve "${name}": no matching entity found in ${types.join(', ')}. Recently updated: ${describe(mostRecentlyUpdated(inScope)) || '(none)'}`,
	)
}

const AVAILABLE_LIMIT = 30

function mostRecentlyUpdated(entities: ResolvedEntity[]) {
	return [...entities]
		.sort((a, b) => b.entity.updatedAt.localeCompare(a.entity.updatedAt))
		.slice(0, AVAILABLE_LIMIT)
}

function describe(entities: ResolvedEntity[]) {
	return entities.map((e) => `${e.type} "${e.entity.name}"`).join(', ')
}
