import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['calendar', 'worldDetails'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			createCalendarPresentation: build.mutation<
				CreateCalendarPresentationApiResponse,
				CreateCalendarPresentationApiArg
			>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/presentations`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['calendar'],
			}),
			updateCalendarPresentation: build.mutation<
				UpdateCalendarPresentationApiResponse,
				UpdateCalendarPresentationApiArg
			>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/presentation/${queryArg.presentationId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: ['calendar'],
			}),
			deleteCalendarPresentation: build.mutation<
				DeleteCalendarPresentationApiResponse,
				DeleteCalendarPresentationApiArg
			>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/presentation/${queryArg.presentationId}`,
					method: 'DELETE',
				}),
				invalidatesTags: ['calendar'],
			}),
			createCalendarPresentationUnit: build.mutation<
				CreateCalendarPresentationUnitApiResponse,
				CreateCalendarPresentationUnitApiArg
			>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/presentation/${queryArg.presentationId}/units`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['calendar'],
			}),
			updateCalendarPresentationUnit: build.mutation<
				UpdateCalendarPresentationUnitApiResponse,
				UpdateCalendarPresentationUnitApiArg
			>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/presentation/${queryArg.presentationId}/units/${queryArg.unitId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: ['calendar'],
			}),
			deleteCalendarPresentationUnit: build.mutation<
				DeleteCalendarPresentationUnitApiResponse,
				DeleteCalendarPresentationUnitApiArg
			>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/presentation/${queryArg.presentationId}/units/${queryArg.unitId}`,
					method: 'DELETE',
				}),
				invalidatesTags: ['calendar'],
			}),
			listCalendars: build.query<ListCalendarsApiResponse, ListCalendarsApiArg>({
				query: () => ({ url: `/api/calendars` }),
				providesTags: ['calendar'],
			}),
			createCalendar: build.mutation<CreateCalendarApiResponse, CreateCalendarApiArg>({
				query: (queryArg) => ({ url: `/api/calendars`, method: 'POST', body: queryArg.body }),
				invalidatesTags: ['calendar'],
			}),
			getCalendar: build.query<GetCalendarApiResponse, GetCalendarApiArg>({
				query: (queryArg) => ({ url: `/api/calendar/${queryArg.calendarId}` }),
				providesTags: ['calendar'],
			}),
			updateCalendar: build.mutation<UpdateCalendarApiResponse, UpdateCalendarApiArg>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: ['calendar'],
			}),
			deleteCalendar: build.mutation<DeleteCalendarApiResponse, DeleteCalendarApiArg>({
				query: (queryArg) => ({ url: `/api/calendar/${queryArg.calendarId}`, method: 'DELETE' }),
				invalidatesTags: ['calendar'],
			}),
			getCalendarPreview: build.query<GetCalendarPreviewApiResponse, GetCalendarPreviewApiArg>({
				query: (queryArg) => ({ url: `/api/calendar/${queryArg.calendarId}/preview` }),
				providesTags: ['calendar'],
			}),
			createCalendarUnit: build.mutation<CreateCalendarUnitApiResponse, CreateCalendarUnitApiArg>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/units`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['calendar'],
			}),
			updateCalendarUnit: build.mutation<UpdateCalendarUnitApiResponse, UpdateCalendarUnitApiArg>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/unit/${queryArg.unitId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: ['calendar'],
			}),
			deleteCalendarUnit: build.mutation<DeleteCalendarUnitApiResponse, DeleteCalendarUnitApiArg>({
				query: (queryArg) => ({
					url: `/api/calendar/${queryArg.calendarId}/unit/${queryArg.unitId}`,
					method: 'DELETE',
				}),
				invalidatesTags: ['calendar'],
			}),
			listWorldCalendars: build.query<ListWorldCalendarsApiResponse, ListWorldCalendarsApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/calendars` }),
				providesTags: ['calendar', 'worldDetails'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as calendarApi }
export type CreateCalendarPresentationApiResponse = /** status 200  */ {
	units: {
		id: string
		createdAt: string
		updatedAt: string
		name: string
		calendarId: string
		presentationId: string
		position: number
		formatString: string
		subdivision: number
		labeledIndices: number[]
		unitId: string
	}[]
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	compression: number
	scaleFactor: number
	baselineUnitId?: null | string
}
export type CreateCalendarPresentationApiArg = {
	/** Any string value */
	calendarId: string
	body: {
		name: string
		scaleFactor?: number
	}
}
export type UpdateCalendarPresentationApiResponse = /** status 200  */ {
	units: {
		id: string
		createdAt: string
		updatedAt: string
		name: string
		calendarId: string
		presentationId: string
		position: number
		formatString: string
		subdivision: number
		labeledIndices: number[]
		unitId: string
	}[]
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	compression: number
	scaleFactor: number
	baselineUnitId?: null | string
}
export type UpdateCalendarPresentationApiArg = {
	/** Any string value */
	calendarId: string
	/** Any string value */
	presentationId: string
	body: {
		name?: string
		compression?: number
		baselineUnitId?: null | string
	}
}
export type DeleteCalendarPresentationApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	compression: number
	scaleFactor: number
	baselineUnitId?: null | string
}
export type DeleteCalendarPresentationApiArg = {
	/** Any string value */
	calendarId: string
	/** Any string value */
	presentationId: string
}
export type CreateCalendarPresentationUnitApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	presentationId: string
	position: number
	formatString: string
	subdivision: number
	labeledIndices: number[]
	unitId: string
}
export type CreateCalendarPresentationUnitApiArg = {
	/** Any string value */
	calendarId: string
	/** Any string value */
	presentationId: string
	body: {
		unitId: string
		formatString?: string
		subdivision?: number
		labeledIndices?: number[]
	}
}
export type UpdateCalendarPresentationUnitApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	presentationId: string
	position: number
	formatString: string
	subdivision: number
	labeledIndices: number[]
	unitId: string
}
export type UpdateCalendarPresentationUnitApiArg = {
	/** Any string value */
	calendarId: string
	/** Any string value */
	presentationId: string
	/** Any string value */
	unitId: string
	body: {
		formatString?: string
		subdivision?: number
		labeledIndices?: number[]
	}
}
export type DeleteCalendarPresentationUnitApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	presentationId: string
	position: number
	formatString: string
	subdivision: number
	labeledIndices: number[]
	unitId: string
}
export type DeleteCalendarPresentationUnitApiArg = {
	/** Any string value */
	calendarId: string
	/** Any string value */
	presentationId: string
	/** Any string value */
	unitId: string
}
export type ListCalendarsApiResponse = /** status 200  */ {
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
export type ListCalendarsApiArg = void
export type CreateCalendarApiResponse = /** status 200  */ {
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
}
export type CreateCalendarApiArg = {
	body: {
		name: string
		templateId?: string
	}
}
export type GetCalendarApiResponse = /** status 200  */ {
	units: {
		children: {
			id: string
			createdAt: string
			updatedAt: string
			calendarId: string
			position: number
			label?: null | string
			shortLabel?: null | string
			repeats: number
			parentUnitId: string
			childUnitId: string
		}[]
		parents: {
			id: string
			createdAt: string
			updatedAt: string
			calendarId: string
			position: number
			label?: null | string
			shortLabel?: null | string
			repeats: number
			parentUnitId: string
			childUnitId: string
		}[]
		id: string
		createdAt: string
		updatedAt: string
		name: string
		calendarId: string
		position: number
		displayName?: null | string
		displayNameShort?: null | string
		displayNamePlural?: null | string
		formatMode: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
		formatShorthand?: null | string
		negativeFormat: 'MinusSign' | 'AbsoluteValue'
		duration: string
		treeDepth: number
	}[]
	presentations: {
		units: {
			id: string
			createdAt: string
			updatedAt: string
			name: string
			calendarId: string
			presentationId: string
			position: number
			formatString: string
			subdivision: number
			labeledIndices: number[]
			unitId: string
		}[]
		id: string
		createdAt: string
		updatedAt: string
		name: string
		calendarId: string
		compression: number
		scaleFactor: number
		baselineUnitId?: null | string
	}[]
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
}
export type GetCalendarApiArg = {
	/** Any string value */
	calendarId: string
}
export type UpdateCalendarApiResponse = /** status 200  */ {
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
}
export type UpdateCalendarApiArg = {
	/** Any string value */
	calendarId: string
	body: {
		name?: string
		originTime?: string
		dateFormat?: null | string
	}
}
export type DeleteCalendarApiResponse = /** status 200  */ {
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
}
export type DeleteCalendarApiArg = {
	/** Any string value */
	calendarId: string
}
export type GetCalendarPreviewApiResponse = /** status 200  */ {
	units: {
		children: {
			id: string
			calendarId: string
			position: number
			label?: null | string
			shortLabel?: null | string
			repeats: number
			parentUnitId: string
			childUnitId: string
		}[]
		parents: {
			id: string
			calendarId: string
			position: number
			label?: null | string
			shortLabel?: null | string
			repeats: number
			parentUnitId: string
			childUnitId: string
		}[]
		id: string
		name: string
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
	presentations: {
		units: {
			id: string
			name: string
			calendarId: string
			position: number
			formatString: string
			subdivision: number
			labeledIndices: number[]
			unitId: string
		}[]
		id: string
		name: string
		compression: number
		scaleFactor: number
		baselineUnitId?: null | string
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
		id: string
		name: string
		position: number
		formatShorthand?: null | string
	}[]
	description: string
	id: string
	updatedAt: string
	name: string
	position: number
	originTime: string
	dateFormat?: null | string
}
export type GetCalendarPreviewApiArg = {
	/** Any string value */
	calendarId: string
}
export type CreateCalendarUnitApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	position: number
	displayName?: null | string
	displayNameShort?: null | string
	displayNamePlural?: null | string
	formatMode: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
	formatShorthand?: null | string
	negativeFormat: 'MinusSign' | 'AbsoluteValue'
	duration: string
	treeDepth: number
}
export type CreateCalendarUnitApiArg = {
	/** Any string value */
	calendarId: string
	body: {
		name: string
		displayName?: null | string
		displayNameShort?: null | string
		displayNamePlural?: null | string
		formatMode?: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
		formatShorthand?: null | string
	}
}
export type UpdateCalendarUnitApiResponse = /** status 200  */ {
	children: {
		id: string
		createdAt: string
		updatedAt: string
		calendarId: string
		position: number
		label?: null | string
		shortLabel?: null | string
		repeats: number
		parentUnitId: string
		childUnitId: string
	}[]
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	position: number
	displayName?: null | string
	displayNameShort?: null | string
	displayNamePlural?: null | string
	formatMode: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
	formatShorthand?: null | string
	negativeFormat: 'MinusSign' | 'AbsoluteValue'
	duration: string
	treeDepth: number
}
export type UpdateCalendarUnitApiArg = {
	/** Any string value */
	calendarId: string
	/** Any string value */
	unitId: string
	body: {
		name?: string
		displayName?: null | string
		displayNameShort?: null | string
		displayNamePlural?: null | string
		formatMode?: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
		formatShorthand?: null | string
		children?: {
			childUnitId: string
			repeats: number
			label?: null | string
			shortLabel?: null | string
		}[]
		position?: number
	}
}
export type DeleteCalendarUnitApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	calendarId: string
	position: number
	displayName?: null | string
	displayNameShort?: null | string
	displayNamePlural?: null | string
	formatMode: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
	formatShorthand?: null | string
	negativeFormat: 'MinusSign' | 'AbsoluteValue'
	duration: string
	treeDepth: number
}
export type DeleteCalendarUnitApiArg = {
	/** Any string value */
	calendarId: string
	/** Any string value */
	unitId: string
}
export type ListWorldCalendarsApiResponse = /** status 200  */ {
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
export type ListWorldCalendarsApiArg = {
	/** Any string value */
	worldId: string
}
export const {
	useCreateCalendarPresentationMutation,
	useUpdateCalendarPresentationMutation,
	useDeleteCalendarPresentationMutation,
	useCreateCalendarPresentationUnitMutation,
	useUpdateCalendarPresentationUnitMutation,
	useDeleteCalendarPresentationUnitMutation,
	useListCalendarsQuery,
	useLazyListCalendarsQuery,
	useCreateCalendarMutation,
	useGetCalendarQuery,
	useLazyGetCalendarQuery,
	useUpdateCalendarMutation,
	useDeleteCalendarMutation,
	useGetCalendarPreviewQuery,
	useLazyGetCalendarPreviewQuery,
	useCreateCalendarUnitMutation,
	useUpdateCalendarUnitMutation,
	useDeleteCalendarUnitMutation,
	useListWorldCalendarsQuery,
	useLazyListWorldCalendarsQuery,
} = injectedRtkApi
