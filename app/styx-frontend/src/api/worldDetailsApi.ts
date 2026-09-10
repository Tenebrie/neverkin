import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['worldDetails', 'worldCommonIcons'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			updateWorld: build.mutation<UpdateWorldApiResponse, UpdateWorldApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: ['worldDetails'],
			}),
			getWorldInfo: build.query<GetWorldInfoApiResponse, GetWorldInfoApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}` }),
				providesTags: ['worldDetails'],
			}),
			getCommonWorldEventIcons: build.query<
				GetCommonWorldEventIconsApiResponse,
				GetCommonWorldEventIconsApiArg
			>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/icons/events/common` }),
				providesTags: ['worldDetails', 'worldCommonIcons'],
			}),
			getWorldBrief: build.query<GetWorldBriefApiResponse, GetWorldBriefApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/brief` }),
				providesTags: ['worldDetails'],
			}),
			setWorldAccessMode: build.mutation<SetWorldAccessModeApiResponse, SetWorldAccessModeApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/access`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['worldDetails'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as worldDetailsApi }
export type UpdateWorldApiResponse = unknown
export type UpdateWorldApiArg = {
	/** Any string value */
	worldId: string
	body: {
		name?: string
		description?: string
		calendars?: string[]
		timeOrigin?: number
	}
}
export type GetWorldInfoApiResponse = /** status 200  */ {
	isReadOnly: boolean
	calendars: {
		units: {
			children: {
				id: string
				position: number
				calendarId: string
				label?: null | string
				shortLabel?: null | string
				repeats: number
				parentUnitId: string
				childUnitId: string
			}[]
			parents: {
				id: string
				position: number
				calendarId: string
				label?: null | string
				shortLabel?: null | string
				repeats: number
				parentUnitId: string
				childUnitId: string
			}[]
			name: string
			id: string
			position: number
			displayName: string
			displayNameShort: string
			displayNamePlural: string
			formatMode: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
			formatShorthand?: null | string
			negativeFormat: 'MinusSign' | 'AbsoluteValue'
			duration: string
			treeDepth: number
		}[]
		seasons: {
			intervals: {
				id: string
				createdAt: string
				updatedAt: string
				calendarId: string
				leftIndex: number
				rightIndex: number
				seasonId: string
			}[]
			name: string
			id: string
			position: number
			formatShorthand?: null | string
		}[]
		presentations: {
			units: {
				name: string
				id: string
				position: number
				calendarId: string
				formatString: string
				subdivision: number
				labeledIndices: number[]
				unitId: string
			}[]
			name: string
			id: string
			compression: number
			scaleFactor: number
			baselineUnitId?: null | string
		}[]
		name: string
		id: string
		updatedAt: string
		description: string
		position: number
		originTime: string
		dateFormat?: null | string
	}[]
	actors: {
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Tag' | 'Event' | 'Article' | 'Node'
		}[]
		pages: {
			name: string
			id: string
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Tag' | 'Event' | 'Article' | 'Node'
		}[]
		name: string
		id: string
		createdAt: string
		updatedAt: string
		worldId: string
		content: string
		contentRich: string
		title: string
		icon: string
		color: string
		parentFolderId?: null | string
		parentFolderPosition: number
	}[]
	events: {
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Tag' | 'Event' | 'Article' | 'Node'
		}[]
		pages: {
			name: string
			id: string
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Tag' | 'Event' | 'Article' | 'Node'
		}[]
		deltaStates: {
			name?: null | string
			id: string
			createdAt: string
			updatedAt: string
			description?: null | string
			timestamp: string
			descriptionRich?: null | string
			worldEventId: string
		}[]
		name: string
		id: string
		createdAt: string
		updatedAt: string
		worldId: string
		content: string
		contentRich: string
		timestamp: string
		icon: string
		color: string
		parentFolderId?: null | string
		parentFolderPosition: number
		revokedAt?: null | string
		worldEventTrackId?: null | string
	}[]
	tags: {
		mentions: {
			targetId: string
			targetType: 'Actor' | 'Tag' | 'Event' | 'Article' | 'Node'
		}[]
		mentionedIn: {
			sourceId: string
			sourceType: 'Actor' | 'Tag' | 'Event' | 'Article' | 'Node'
		}[]
		name: string
		id: string
		createdAt: string
		updatedAt: string
		description: string
		worldId: string
		color: string
		parentFolderId?: null | string
		parentFolderPosition: number
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
}
export type GetWorldInfoApiArg = {
	/** Any string value */
	worldId: string
}
export type GetCommonWorldEventIconsApiResponse = /** status 200  */ {
	collections: {
		id: string
		name: string
		icons: string[]
		count: number
		procedural: boolean
	}[]
}
export type GetCommonWorldEventIconsApiArg = {
	/** Any string value */
	worldId: string
}
export type GetWorldBriefApiResponse = /** status 200  */ {
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
export type GetWorldBriefApiArg = {
	/** Any string value */
	worldId: string
}
export type SetWorldAccessModeApiResponse = unknown
export type SetWorldAccessModeApiArg = {
	/** Any string value */
	worldId: string
	body: {
		access: 'Private' | 'PublicRead' | 'PublicEdit'
	}
}
export const {
	useUpdateWorldMutation,
	useGetWorldInfoQuery,
	useLazyGetWorldInfoQuery,
	useGetCommonWorldEventIconsQuery,
	useLazyGetCommonWorldEventIconsQuery,
	useGetWorldBriefQuery,
	useLazyGetWorldBriefQuery,
	useSetWorldAccessModeMutation,
} = injectedRtkApi
