import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice, original } from '@reduxjs/toolkit'

import {
	ActorDetails,
	MarkerType,
	TimelineEntity,
	WorldAccessMode,
	WorldCalendar,
	WorldDetails,
	WorldEvent,
	WorldEventDelta,
	WorldTag,
} from '@/api/types/worldTypes'
import { WikiArticle } from '@/api/types/worldWikiTypes'
import { GetWorldInfoApiResponse } from '@/api/worldDetailsApi'
import { replaceChangedElements } from '@/app/utils/replaceChangedElements'

import { ingestWorld } from '../../utils/ingestEntity'

export const initialState = {
	isLoaded: false as boolean,
	isUnauthorized: false as boolean,
	id: '' as string,
	name: '' as string,
	description: '' as string,
	events: [] as WorldEvent[],
	actors: [] as ActorDetails[],
	tags: [] as WorldTag[],
	calendars: [] as WorldCalendar[],
	timeOrigin: 0,
	createdAt: '0',
	updatedAt: '0',
	selectedTimelineMarkers: [] as { key: string; eventId: string }[],
	isReadOnly: false as boolean,
	accessMode: 'Private' as WorldAccessMode,

	search: {
		query: null as string | null,
		isLoading: false as boolean,
		results: {
			articles: [] as WikiArticle[],
			events: [] as WorldEvent[],
			actors: [] as ActorDetails[],
			tags: [] as WorldTag[],
		},
	},

	eventCreator: {
		ghost: null as WorldEvent | null,
	},

	eventDeltaCreator: {
		ghost: null as WorldEventDelta | null,
	},

	timelineContextMenu: {
		isOpen: false as boolean,
		selectedTime: 0 as number,
		selectedEvent: null as TimelineEntity<MarkerType> | null,
		mousePos: { x: 0, y: 0 } as { x: number; y: number },
	},

	selectedTime: 0 as number,
}

export const worldSlice = createSlice({
	name: 'world',
	initialState,
	reducers: {
		setId: (state, { payload }: PayloadAction<string>) => {
			state.id = payload
		},
		setName: (state, { payload }: PayloadAction<string>) => {
			state.name = payload
		},
		loadWorld: (state, { payload }: PayloadAction<{ world: GetWorldInfoApiResponse }>) => {
			const world = payload.world

			const current = original(state)
			const ingested = ingestWorld(world)
			Object.assign(state, ingested, {
				actors: replaceChangedElements(current.actors, ingested.actors),
				calendars: replaceChangedElements(current.calendars, ingested.calendars),
				events: replaceChangedElements(current.events, ingested.events),
				tags: replaceChangedElements(current.tags, ingested.tags),
			} satisfies Partial<WorldDetails>)

			state.isLoaded = true
			state.isUnauthorized = false
		},
		unloadWorld: (state) => {
			state.isLoaded = false
			state.isUnauthorized = false
			state.events = []
			state.actors = []
			state.tags = []
			state.isReadOnly = false
		},
		setUnauthorized: (state, { payload }: PayloadAction<boolean>) => {
			state.isUnauthorized = payload
		},
		addEvent: (state, { payload }: PayloadAction<WorldEvent>) => {
			state.events = state.events.concat(payload)
		},
		updateEvent: (state, { payload }: PayloadAction<Pick<WorldEvent, 'id'> & Partial<WorldEvent>>) => {
			const event = state.events.find((e) => e.id === payload.id)
			if (!event) {
				return
			}

			const newEvent = {
				...event,
				...payload,
			}
			state.events.splice(state.events.indexOf(event), 1, newEvent)
		},
		removeEvent: (state, { payload }: PayloadAction<string>) => {
			state.events = state.events.filter((e) => e.id !== payload)
		},
		addActor: (state, { payload }: PayloadAction<ActorDetails>) => {
			state.actors = state.actors.concat(payload).sort((a, b) => a.name.localeCompare(b.name))
		},
		updateActor: (state, { payload }: PayloadAction<Pick<ActorDetails, 'id'> & Partial<ActorDetails>>) => {
			const actor = state.actors.find((e) => e.id === payload.id)
			if (!actor) {
				return
			}

			const newActor = {
				...actor,
				...payload,
			}
			state.actors.splice(state.actors.indexOf(actor), 1, newActor)
		},
		removeActor: (state, { payload }: PayloadAction<string>) => {
			state.actors = state.actors.filter((e) => e.id !== payload)
		},
		addTag: (state, { payload }: PayloadAction<WorldTag>) => {
			state.tags = state.tags.concat(payload)
		},
		updateTag: (state, { payload }: PayloadAction<Pick<WorldTag, 'id'> & Partial<WorldTag>>) => {
			const tag = state.tags.find((t) => t.id === payload.id)
			if (!tag) {
				return
			}

			const newTag = {
				...tag,
				...payload,
			}
			state.tags.splice(state.tags.indexOf(tag), 1, newTag)
		},
		removeTag: (state, { payload }: PayloadAction<string>) => {
			state.tags = state.tags.filter((e) => e.id !== payload)
		},
		addTimelineMarkerToSelection: (
			state,
			{ payload }: PayloadAction<{ key: string; eventId: string; multiselect: boolean }>,
		) => {
			const record = { key: payload.key, eventId: payload.eventId }
			if (!payload.multiselect) {
				state.selectedTimelineMarkers = [record]
				return
			}

			if (state.selectedTimelineMarkers.some((m) => m.key === payload.key)) {
				return
			}
			state.selectedTimelineMarkers = [...state.selectedTimelineMarkers, record]
		},
		setTimelineMarkerSelection: (state, { payload }: PayloadAction<{ key: string; eventId: string }[]>) => {
			if (
				state.selectedTimelineMarkers.length === payload.length &&
				state.selectedTimelineMarkers.every((marker, index) => marker.key === payload[index].key)
			) {
				return
			}
			state.selectedTimelineMarkers = payload
		},
		removeTimelineMarkerFromSelection: (state, { payload }: PayloadAction<string>) => {
			state.selectedTimelineMarkers = state.selectedTimelineMarkers.filter((marker) => marker.key !== payload)
		},
		clearSelections: (state) => {
			state.selectedTimelineMarkers = []
		},

		/* Event creator */
		setEventCreatorGhost: (state, { payload }: PayloadAction<WorldEvent | null>) => {
			state.eventCreator.ghost = payload
		},
		setEventDeltaCreatorGhost: (state, { payload }: PayloadAction<WorldEventDelta | null>) => {
			state.eventDeltaCreator.ghost = payload
		},

		/* Search */
		setSearchLoading: (state, { payload }: PayloadAction<boolean>) => {
			state.search.isLoading = payload
		},
		setSearchResults: (
			state,
			{ payload }: PayloadAction<{ query: string; results: (typeof initialState)['search']['results'] }>,
		) => {
			state.search.query = payload.query
			state.search.isLoading = false
			state.search.results = payload.results
		},
		cancelSearch: (state) => {
			state.search.query = null
			state.search.isLoading = false
		},

		/* Timeline context menu */
		openTimelineContextMenu: (
			state,
			{
				payload,
			}: PayloadAction<{
				selectedTime: number
				selectedEvent: TimelineEntity<MarkerType> | null
				mousePos: { x: number; y: number }
			}>,
		) => {
			state.timelineContextMenu.isOpen = true
			state.timelineContextMenu.selectedTime = payload.selectedTime
			state.timelineContextMenu.selectedEvent = payload.selectedEvent
			state.timelineContextMenu.mousePos = payload.mousePos
		},

		closeTimelineContextMenu: (state) => {
			state.timelineContextMenu.isOpen = false
		},

		/* Navigation state */
		setSelectedTime: (state, { payload }: PayloadAction<number>) => {
			state.selectedTime = payload
		},
	},
})

export type WorldState = typeof initialState
export const worldInitialState = initialState
export const WorldReducer = worldSlice.reducer
