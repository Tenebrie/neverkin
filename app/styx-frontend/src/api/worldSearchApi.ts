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
			name: string
			worldId: string
			entityType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
			entityId: string
			pageId?: null | string
			title?: null | string
			content: string
			timestamp?: null | string
			createdAt: string
			updatedAt: string
			icon: string
			color: string
		}[]
		name: string
		worldId: string
		entityType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		entityId: string
		pageId?: null | string
		title?: null | string
		content: string
		timestamp?: null | string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
	}[]
	worlds: {
		id: string
		relevance: number
	}[]
}
export type GlobalSearchApiArg = {
	q: string
}
export type SearchWorldApiResponse = /** status 200  */ {
	actors: {
		pages: {
			name: string
			id: string
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
			name: string
			worldId: string
			content: string
			createdAt: string
			updatedAt: string
			icon: string
			color: string
			id: string
			contentRich: string
			parentFolderId?: null | string
			parentActorId?: null | string
			parentEventId?: null | string
			parentArticleId?: null | string
			positionX: number
			positionY: number
			parentTagId?: null | string
		}[]
		name: string
		worldId: string
		title: string
		content: string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
		id: string
		contentRich: string
		parentFolderId?: null | string
		parentFolderPosition: number
	}[]
	articles: {
		pages: {
			name: string
			id: string
		}[]
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		name: string
		worldId: string
		content: string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
		id: string
		contentRich: string
		parentFolderId?: null | string
		parentFolderPosition: number
	}[]
	events: {
		pages: {
			name: string
			id: string
		}[]
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
		}[]
		name: string
		worldId: string
		content: string
		timestamp: string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
		id: string
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
		name: string
		worldId: string
		createdAt: string
		updatedAt: string
		icon: string
		color: string
		id: string
		parentFolderId?: null | string
		parentFolderPosition: number
		description: string
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
