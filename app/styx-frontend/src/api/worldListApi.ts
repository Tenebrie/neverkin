import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['worldList', 'worldDetails'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			toggleWorldPin: build.mutation<ToggleWorldPinApiResponse, ToggleWorldPinApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/pin/toggle`, method: 'POST' }),
				invalidatesTags: ['worldList'],
			}),
			getWorlds: build.query<GetWorldsApiResponse, GetWorldsApiArg>({
				query: () => ({ url: `/api/worlds` }),
				providesTags: ['worldList'],
			}),
			createWorld: build.mutation<CreateWorldApiResponse, CreateWorldApiArg>({
				query: (queryArg) => ({ url: `/api/worlds`, method: 'POST', body: queryArg.body }),
				invalidatesTags: ['worldList'],
			}),
			deleteWorld: build.mutation<DeleteWorldApiResponse, DeleteWorldApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}`, method: 'DELETE' }),
				invalidatesTags: ['worldList'],
			}),
			leaveWorldCollaboration: build.mutation<
				LeaveWorldCollaborationApiResponse,
				LeaveWorldCollaborationApiArg
			>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/collaboration/leave`, method: 'POST' }),
				invalidatesTags: ['worldList', 'worldDetails'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as worldListApi }
export type ToggleWorldPinApiResponse = /** status 200  */ {
	pinned: boolean
	rank: number
}
export type ToggleWorldPinApiArg = {
	worldId: string
}
export type GetWorldsApiResponse = /** status 200  */ {
	ownedWorlds: {
		calendars: {
			name: string
			id: string
			createdAt: string
			updatedAt: string
			description: string
			ownerId?: null | string
			position: number
			originTime: string
			dateFormat?: null | string
			worldId?: null | string
		}[]
		collaborators: {
			userId: string
			worldId: string
			access: 'ReadOnly' | 'Editing'
		}[]
		userPins: {
			createdAt: string
			userId: string
			worldId: string
			rank: number
		}[]
		name: string
		id: string
		createdAt: string
		updatedAt: string
		description: string
		calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
		timeOrigin: string
		ownerId: string
		accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
	}[]
	contributableWorlds: {
		calendars: {
			name: string
			id: string
			createdAt: string
			updatedAt: string
			description: string
			ownerId?: null | string
			position: number
			originTime: string
			dateFormat?: null | string
			worldId?: null | string
		}[]
		collaborators: {
			userId: string
			worldId: string
			access: 'ReadOnly' | 'Editing'
		}[]
		userPins: {
			createdAt: string
			userId: string
			worldId: string
			rank: number
		}[]
		name: string
		id: string
		createdAt: string
		updatedAt: string
		description: string
		calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
		timeOrigin: string
		ownerId: string
		accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
	}[]
	visibleWorlds: {
		calendars: {
			name: string
			id: string
			createdAt: string
			updatedAt: string
			description: string
			ownerId?: null | string
			position: number
			originTime: string
			dateFormat?: null | string
			worldId?: null | string
		}[]
		collaborators: {
			userId: string
			worldId: string
			access: 'ReadOnly' | 'Editing'
		}[]
		userPins: {
			createdAt: string
			userId: string
			worldId: string
			rank: number
		}[]
		name: string
		id: string
		createdAt: string
		updatedAt: string
		description: string
		calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
		timeOrigin: string
		ownerId: string
		accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
	}[]
}
export type GetWorldsApiArg = void
export type CreateWorldApiResponse = /** status 200  */ {
	name: string
	id: string
}
export type CreateWorldApiArg = {
	body: {
		name: string
		description?: string
		calendars?: string[]
		timeOrigin?: number
	}
}
export type DeleteWorldApiResponse = /** status 200  */ {
	name: string
	id: string
	createdAt: string
	updatedAt: string
	description: string
	calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
	timeOrigin: string
	ownerId: string
	accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
}
export type DeleteWorldApiArg = {
	/** Any string value */
	worldId: string
}
export type LeaveWorldCollaborationApiResponse = unknown
export type LeaveWorldCollaborationApiArg = {
	/** Any string value */
	worldId: string
}
export const {
	useToggleWorldPinMutation,
	useGetWorldsQuery,
	useLazyGetWorldsQuery,
	useCreateWorldMutation,
	useDeleteWorldMutation,
	useLeaveWorldCollaborationMutation,
} = injectedRtkApi
