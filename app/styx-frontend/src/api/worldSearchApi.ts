import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['worldSearch', 'worldDetails', 'worldTag'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			globalSearch: build.query<GlobalSearchApiResponse, GlobalSearchApiArg>({
				query: (queryArg) => ({
					url: `/api/search/${queryArg.query}`,
					params: {
						mode: queryArg.mode,
						minTime: queryArg.minTime,
						maxTime: queryArg.maxTime,
					},
				}),
				providesTags: ['worldSearch', 'worldDetails', 'worldTag'],
			}),
			searchWorld: build.query<SearchWorldApiResponse, SearchWorldApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/search/${queryArg.query}`,
					params: {
						mode: queryArg.mode,
						minTime: queryArg.minTime,
						maxTime: queryArg.maxTime,
					},
				}),
				providesTags: ['worldSearch', 'worldDetails', 'worldTag'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as worldSearchApi }
export type GlobalSearchApiResponse = /** status 200  */ {
	title?: null | string
	worldId: string
	createdAt: string
	updatedAt: string
	name: string
	content: string
	pageId?: null | string
	timestamp?: null | string
	entityType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
	entityId: string
}[]
export type GlobalSearchApiArg = {
	query: string
	mode?: 'string_match' | 'split_by_space'
	minTime?: number
	maxTime?: number
}
export type SearchWorldApiResponse = /** status 200  */ {
	actors: {
		pages: {
			id: string
			name: string
		}[]
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		nodes: {
			id: string
			worldId: string
			createdAt: string
			updatedAt: string
			name: string
			color: string
			content: string
			contentRich: string
			parentFolderId?: null | string
			parentActorId?: null | string
			parentEventId?: null | string
			parentArticleId?: null | string
			positionX: number
			positionY: number
			parentTagId?: null | string
		}[]
		id: string
		title: string
		worldId: string
		createdAt: string
		updatedAt: string
		name: string
		icon: string
		color: string
		content: string
		contentRich: string
		parentFolderId?: null | string
		parentFolderPosition: number
	}[]
	articles: {
		pages: {
			id: string
			name: string
		}[]
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		id: string
		worldId: string
		createdAt: string
		updatedAt: string
		name: string
		icon: string
		color: string
		content: string
		contentRich: string
		parentFolderId?: null | string
		parentFolderPosition: number
	}[]
	events: {
		pages: {
			id: string
			name: string
		}[]
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		id: string
		worldId: string
		createdAt: string
		updatedAt: string
		name: string
		icon: string
		color: string
		content: string
		contentRich: string
		parentFolderId?: null | string
		parentFolderPosition: number
		timestamp: string
		revokedAt?: null | string
		worldEventTrackId?: null | string
	}[]
	tags: {
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		description: string
		id: string
		worldId: string
		createdAt: string
		updatedAt: string
		name: string
		color: string
		parentFolderId?: null | string
		parentFolderPosition: number
	}[]
}
export type SearchWorldApiArg = {
	worldId: string
	query: string
	mode?: 'string_match' | 'split_by_space'
	minTime?: number
	maxTime?: number
}
export const {
	useGlobalSearchQuery,
	useLazyGlobalSearchQuery,
	useSearchWorldQuery,
	useLazySearchWorldQuery,
} = injectedRtkApi
