import { toLowerCase } from '@/app/utils/toLowerCase'

import { GlobalSearchApiResponse } from '../worldSearchApi'

export type GlobalSearchHit = ReturnType<typeof ingestSearchHit>
export type GlobalSearchEntry = GlobalSearchHit['pages'][number]

export function ingestSearchHits(hits: GlobalSearchApiResponse['hits']) {
	return hits.map((hit) => ingestSearchHit(hit))
}

export function ingestSearchHit(hit: GlobalSearchApiResponse['hits'][number]) {
	return {
		...ingestSearchEntry(hit),
		pages: hit.pages.map((page) => ingestSearchEntry(page)),
	}
}

function ingestSearchEntry(entry: GlobalSearchApiResponse['hits'][number]['pages'][number]) {
	const ingestedEntry = {
		...entry,
		id: entry.entityId,
		type: toLowerCase(entry.entityType),
	}
	return ingestedEntry as Omit<typeof ingestedEntry, 'entityId' | 'entityType'>
}
