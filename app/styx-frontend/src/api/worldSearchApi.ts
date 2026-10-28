import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['worldSearch', 'worldDetails', 'worldTag'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
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
			worldId: string
			id: string
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
		worldId: string
		id: string
		createdAt: string
		updatedAt: string
		name: string
		title: string
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
		worldId: string
		id: string
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
		deltaStates: {
			description?: null | string
			id: string
			createdAt: string
			updatedAt: string
			name?: null | string
			timestamp: string
			descriptionRich?: null | string
			worldEventId: string
		}[]
		worldId: string
		id: string
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
		worldId: string
		id: string
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
export const { useSearchWorldQuery, useLazySearchWorldQuery } = injectedRtkApi
