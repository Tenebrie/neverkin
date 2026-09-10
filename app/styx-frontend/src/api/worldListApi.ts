import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['worldList'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
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
			toggleWorldPin: build.mutation<ToggleWorldPinApiResponse, ToggleWorldPinApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/pin/toggle`, method: 'POST' }),
				invalidatesTags: ['worldList'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as worldListApi }
export type GetWorldsApiResponse = /** status 200  */ {
	ownedWorlds: {
		collaborators: {
			worldId: string
			userId: string
			access: 'ReadOnly' | 'Editing'
		}[]
		calendars: {
			description: string
			worldId?: null | string
			id: string
			createdAt: string
			updatedAt: string
			name: string
			ownerId?: null | string
			position: number
			originTime: string
			dateFormat?: null | string
		}[]
		userPins: {
			worldId: string
			createdAt: string
			userId: string
			rank: number
		}[]
		description: string
		id: string
		createdAt: string
		updatedAt: string
		name: string
		calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
		timeOrigin: string
		ownerId: string
		accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
	}[]
	contributableWorlds: {
		collaborators: {
			worldId: string
			userId: string
			access: 'ReadOnly' | 'Editing'
		}[]
		calendars: {
			description: string
			worldId?: null | string
			id: string
			createdAt: string
			updatedAt: string
			name: string
			ownerId?: null | string
			position: number
			originTime: string
			dateFormat?: null | string
		}[]
		userPins: {
			worldId: string
			createdAt: string
			userId: string
			rank: number
		}[]
		description: string
		id: string
		createdAt: string
		updatedAt: string
		name: string
		calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
		timeOrigin: string
		ownerId: string
		accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
	}[]
	visibleWorlds: {
		collaborators: {
			worldId: string
			userId: string
			access: 'ReadOnly' | 'Editing'
		}[]
		calendars: {
			description: string
			worldId?: null | string
			id: string
			createdAt: string
			updatedAt: string
			name: string
			ownerId?: null | string
			position: number
			originTime: string
			dateFormat?: null | string
		}[]
		userPins: {
			worldId: string
			createdAt: string
			userId: string
			rank: number
		}[]
		description: string
		id: string
		createdAt: string
		updatedAt: string
		name: string
		calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
		timeOrigin: string
		ownerId: string
		accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
	}[]
}
export type GetWorldsApiArg = void
export type CreateWorldApiResponse = /** status 200  */ {
	id: string
	name: string
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
	description: string
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
	timeOrigin: string
	ownerId: string
	accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
}
export type DeleteWorldApiArg = {
	/** Any string value */
	worldId: string
}
export type ToggleWorldPinApiResponse = /** status 200  */ {
	pinned: boolean
	rank: number
}
export type ToggleWorldPinApiArg = {
	worldId: string
}
export const {
	useGetWorldsQuery,
	useLazyGetWorldsQuery,
	useCreateWorldMutation,
	useDeleteWorldMutation,
	useToggleWorldPinMutation,
} = injectedRtkApi
