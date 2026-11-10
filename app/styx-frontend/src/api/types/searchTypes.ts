import { toLowerCase } from '@/app/utils/toLowerCase'

import { GlobalSearchApiResponse } from '../worldSearchApi'

export type GlobalSearchHit = ReturnType<typeof ingestSearchHit>

export function ingestSearchHits(hits: GlobalSearchApiResponse['hits']) {
	return hits.map((hit) => ingestSearchHit(hit))
}

export function ingestSearchHit(hit: GlobalSearchApiResponse['hits'][number]) {
	const ingestedHit = {
		...hit,
		id: hit.entityId,
		type: toLowerCase(hit.entityType),
	}
	return ingestedHit as Omit<typeof ingestedHit, 'entityId' | 'entityType'>
}
