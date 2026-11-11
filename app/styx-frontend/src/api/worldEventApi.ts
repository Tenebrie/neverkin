import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['worldEvent', 'worldDetails'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			createWorldEvent: build.mutation<CreateWorldEventApiResponse, CreateWorldEventApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/event`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['worldEvent', 'worldDetails'],
			}),
			updateWorldEvent: build.mutation<UpdateWorldEventApiResponse, UpdateWorldEventApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/event/${queryArg.eventId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: ['worldEvent'],
			}),
			deleteWorldEvent: build.mutation<DeleteWorldEventApiResponse, DeleteWorldEventApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/event/${queryArg.eventId}`,
					method: 'DELETE',
				}),
				invalidatesTags: ['worldEvent', 'worldDetails'],
			}),
			revokeWorldEvent: build.mutation<RevokeWorldEventApiResponse, RevokeWorldEventApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/event/${queryArg.eventId}/revoke`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['worldEvent', 'worldDetails'],
			}),
			unrevokeWorldEvent: build.mutation<UnrevokeWorldEventApiResponse, UnrevokeWorldEventApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/event/${queryArg.eventId}/unrevoke`,
					method: 'POST',
				}),
				invalidatesTags: ['worldEvent', 'worldDetails'],
			}),
			getWorldEventBacklinks: build.query<GetWorldEventBacklinksApiResponse, GetWorldEventBacklinksApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/event/${queryArg.eventId}/backlinks` }),
				providesTags: ['worldEvent'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as worldEventApi }
export type CreateWorldEventApiResponse = /** status 200  */ {
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
	timestamp: string
	revokedAt?: null | string
	worldEventTrackId?: null | string
}
export type CreateWorldEventApiArg = {
	/** Any string value */
	worldId: string
	body: {
		id?: string
		name: string
		icon?: string
		color?: string
		contentRich: string
		timestamp: string
		revokedAt?: null | string
		customName?: boolean
		externalLink?: string
		worldEventTrackId?: null | string
		parentFolderId?: null | string
	}
}
export type UpdateWorldEventApiResponse = /** status 200  */ {
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
	timestamp: string
	revokedAt?: null | string
	worldEventTrackId?: null | string
}
export type UpdateWorldEventApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	eventId: string
	body: {
		name?: string
		icon?: string
		color?: string
		timestamp?: string
		revokedAt?: null | string
		externalLink?: string
		worldEventTrackId?: null | string
	}
}
export type DeleteWorldEventApiResponse = /** status 200  */ {
	count: number
}
export type DeleteWorldEventApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	eventId: string
}
export type RevokeWorldEventApiResponse = /** status 200  */ {
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
}
export type RevokeWorldEventApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	eventId: string
	body: {
		revokedAt: string
	}
}
export type UnrevokeWorldEventApiResponse = /** status 200  */ {
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
}
export type UnrevokeWorldEventApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	eventId: string
}
export type GetWorldEventBacklinksApiResponse = /** status 200  */ {
	type: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
	id: string
	name: string
}[]
export type GetWorldEventBacklinksApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	eventId: string
}
export const {
	useCreateWorldEventMutation,
	useUpdateWorldEventMutation,
	useDeleteWorldEventMutation,
	useRevokeWorldEventMutation,
	useUnrevokeWorldEventMutation,
	useGetWorldEventBacklinksQuery,
	useLazyGetWorldEventBacklinksQuery,
} = injectedRtkApi
