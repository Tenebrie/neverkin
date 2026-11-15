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
					url: `/api/search`,
					params: {
						q: queryArg.q,
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
	hits: {
		pages: {
			title?: null | string
			name: string
			worldId: string
			entityType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
			entityId: string
			pageId?: null | string
			content: string
			timestamp?: null | string
			createdAt: string
			updatedAt: string
			icon: string
			color: string
		}[]
		title?: null | string
		name: string
		worldId: string
		entityType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		entityId: string
		pageId?: null | string
		content: string
		timestamp?: null | string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
	}[]
	worlds: {
		id: string
	}[]
}
export type GlobalSearchApiArg = {
	q: string
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
			name: string
			worldId: string
			content: string
			createdAt: string
			updatedAt: string
			icon: string
			color: string
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
		name: string
		worldId: string
		content: string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
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
		name: string
		worldId: string
		content: string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
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
		name: string
		worldId: string
		content: string
		timestamp: string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
		contentRich: string
		parentFolderId?: null | string
		parentFolderPosition: number
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
		name: string
		worldId: string
		createdAt: string
		updatedAt: string
		icon: string
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
