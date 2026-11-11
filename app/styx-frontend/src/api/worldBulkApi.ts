import { baseApi as api } from './base/baseApi'
export const addTagTypes = [
	'worldBulk',
	'actorList',
	'worldEvent',
	'worldWikiFolder',
	'worldWikiArticle',
	'worldDetails',
	'worldTag',
	'mindmapNode',
] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			bulkUpdateEntities: build.mutation<BulkUpdateEntitiesApiResponse, BulkUpdateEntitiesApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/bulk/update`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			bulkDeleteEntities: build.mutation<BulkDeleteEntitiesApiResponse, BulkDeleteEntitiesApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/bulk/delete`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: [
					'worldBulk',
					'actorList',
					'worldEvent',
					'worldWikiFolder',
					'worldWikiArticle',
					'worldDetails',
					'worldTag',
					'mindmapNode',
				],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as worldBulkApi }
export type BulkUpdateEntitiesApiResponse = unknown
export type BulkUpdateEntitiesApiArg = {
	/** Any string value */
	worldId: string
	body: {
		entities: string[]
		icon?: string
		color?: string
	}
}
export type BulkDeleteEntitiesApiResponse = unknown
export type BulkDeleteEntitiesApiArg = {
	/** Any string value */
	worldId: string
	body: {
		entities: string[]
	}
}
export const { useBulkUpdateEntitiesMutation, useBulkDeleteEntitiesMutation } = injectedRtkApi
