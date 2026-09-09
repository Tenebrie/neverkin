import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import { Actor, WorldEvent, WorldTag } from '@/api/types/worldTypes'
import { BoxedWikiEntity } from '@/app/views/world/views/wiki/hooks/useBoxedWikiContent'

import { ScaleLevel } from '../../schema/ScaleLevel'
import { CalendarUnitEditorTab } from '../time/calendar/types'
import { loadPreferences, PreferencesKey } from './utils/loadPreferences'

const initialState = loadPreferences() as Required<ReturnType<typeof loadPreferences>>

const saveToLocalStorage = (state: PreferencesState) => {
	window.localStorage.setItem(
		PreferencesKey,
		JSON.stringify({
			...state,
			calendarEditor: {
				expandedUnitSections: [],
			},
			outliner: {
				...state.outliner,
				// Do not save expanded entities into storage as it may grow too large
				expandedActors: [],
				expandedEvents: [],
				expandedTags: [],
			},
			wiki: {
				...state.wiki,
				expandedFolders: [],
			},
		}),
	)
	window.sessionStorage.setItem(PreferencesKey, JSON.stringify(state))
}

export const preferencesSlice = createSlice({
	name: 'preferences',
	initialState,
	reducers: {
		loadFromLocalStorage: (state) => {
			const value = loadPreferences()
			state['admin'] = value['admin']
			state['calendarEditor'] = value['calendarEditor']
			state['colorMode'] = value['colorMode']
			state['global'] = value['global']
			state['home'] = value['home']
			state['iconSets'] = value['iconSets']
			state['outliner'] = value['outliner']
			state['overview'] = value['overview']
			state['timeline'] = value['timeline']
			state['wiki'] = value['wiki']
			state['imageGenerator'] = value['imageGenerator']
		},

		/* Admin */
		setAdminNotificationTitle: (state, { payload }: PayloadAction<string>) => {
			state.admin.notificationTitle = payload
			saveToLocalStorage(state)
		},
		setAdminNotificationDescription: (state, { payload }: PayloadAction<string>) => {
			state.admin.notificationDescription = payload
			saveToLocalStorage(state)
		},
		clearAdminNotificationDraft: (state) => {
			state.admin.notificationTitle = ''
			state.admin.notificationDescription = ''
			saveToLocalStorage(state)
		},

		/* Calendar Editor */
		setExpandedCalendarUnitSections: (state, { payload }: PayloadAction<CalendarUnitEditorTab[]>) => {
			state.calendarEditor.expandedUnitSections = payload
			saveToLocalStorage(state)
		},
		toggleExpandedCalendarUnitSection: (state, { payload }: PayloadAction<CalendarUnitEditorTab>) => {
			if (state.calendarEditor.expandedUnitSections.includes(payload)) {
				state.calendarEditor.expandedUnitSections = state.calendarEditor.expandedUnitSections.filter(
					(tab) => tab !== payload,
				)
			} else {
				state.calendarEditor.expandedUnitSections = [...state.calendarEditor.expandedUnitSections, payload]
			}
			saveToLocalStorage(state)
		},

		/* Color Mode */
		setColorMode: (state, { payload }: PayloadAction<'light' | 'dark'>) => {
			state.colorMode = payload
			saveToLocalStorage(state)
		},

		/* Global */
		setAnimatedBackground: (state, { payload }: PayloadAction<boolean>) => {
			state.global.animatedBackground = payload
			saveToLocalStorage(state)
		},
		setShowDiscordLink: (state, { payload }: PayloadAction<boolean>) => {
			state.global.showDiscordLink = payload
			saveToLocalStorage(state)
		},

		/* Home */
		toggleWorldPin: (state, { payload }: PayloadAction<string>) => {
			state.home.pinnedWorlds = state.home.pinnedWorlds.includes(payload)
				? state.home.pinnedWorlds.filter((id) => id !== payload)
				: [...state.home.pinnedWorlds, payload]
			saveToLocalStorage(state)
		},
		setLastOpenedWorld: (state, { payload }: PayloadAction<string>) => {
			state.home.lastOpenedWorldId = payload
			saveToLocalStorage(state)
		},

		/* Icon Sets */
		setRecentIconSets: (state, { payload }: PayloadAction<string[]>) => {
			state.iconSets.recent = payload
			saveToLocalStorage(state)
		},

		/* Outliner */
		setOutlinerTab: (state, { payload }: PayloadAction<number>) => {
			state.outliner.tabIndex = payload
			saveToLocalStorage(state)
		},
		setShowInactiveStatements: (state, { payload }: PayloadAction<boolean>) => {
			state.outliner.showInactiveStatements = payload
			saveToLocalStorage(state)
		},
		collapseActorInOutliner: (state, { payload }: PayloadAction<Actor>) => {
			state.outliner.expandedActors = state.outliner.expandedActors.filter((id) => id !== payload.id)
			saveToLocalStorage(state)
		},
		uncollapseActorInOutliner: (state, { payload }: PayloadAction<Actor>) => {
			state.outliner.expandedActors = [...new Set([...state.outliner.expandedActors, payload.id])]
			saveToLocalStorage(state)
		},
		collapseEventInOutliner: (state, { payload }: PayloadAction<WorldEvent>) => {
			state.outliner.expandedEvents = state.outliner.expandedEvents.filter((id) => id !== payload.id)
			saveToLocalStorage(state)
		},
		uncollapseEventInOutliner: (state, { payload }: PayloadAction<WorldEvent>) => {
			state.outliner.expandedEvents = [...new Set([...state.outliner.expandedEvents, payload.id])]
			saveToLocalStorage(state)
		},
		collapseTagInOutliner: (state, { payload }: PayloadAction<WorldTag>) => {
			state.outliner.expandedTags = state.outliner.expandedTags.filter((id) => id !== payload.id)
			saveToLocalStorage(state)
		},
		uncollapseTagInOutliner: (state, { payload }: PayloadAction<WorldTag>) => {
			state.outliner.expandedTags = [...new Set([...state.outliner.expandedTags, payload.id])]
			saveToLocalStorage(state)
		},

		/* Overview */
		setActorsOpen: (state, { payload }: PayloadAction<boolean>) => {
			state.overview.actorsOpen = payload
			saveToLocalStorage(state)
		},
		setActorsReversed: (state, { payload }: PayloadAction<boolean>) => {
			state.overview.actorsReversed = payload
			saveToLocalStorage(state)
		},
		setEventsOpen: (state, { payload }: PayloadAction<boolean>) => {
			state.overview.eventsOpen = payload
			saveToLocalStorage(state)
		},
		setEventsReversed: (state, { payload }: PayloadAction<boolean>) => {
			state.overview.eventsReversed = payload
			saveToLocalStorage(state)
		},

		/* Timeline */
		setTimelineHeight: (state, { payload }: PayloadAction<number>) => {
			state.timeline.containerHeight = payload
			saveToLocalStorage(state)
		},
		setScaleLevel: (state, { payload }: PayloadAction<ScaleLevel>) => {
			state.timeline.scaleLevel = payload
			saveToLocalStorage(state)
		},
		setReduceAnimations: (state, { payload }: PayloadAction<boolean>) => {
			state.timeline.reduceAnimations = payload
			saveToLocalStorage(state)
		},

		/* Wiki */
		collapseWikiFolder: (state, { payload }: PayloadAction<BoxedWikiEntity>) => {
			state.wiki.expandedFolders = state.wiki.expandedFolders.filter((id) => id !== payload.id)
			saveToLocalStorage(state)
		},
		collapseWikiFolderById: (state, { payload }: PayloadAction<string>) => {
			state.wiki.expandedFolders = state.wiki.expandedFolders.filter((id) => id !== payload)
			saveToLocalStorage(state)
		},
		uncollapseWikiFolder: (state, { payload }: PayloadAction<BoxedWikiEntity>) => {
			state.wiki.expandedFolders = [...new Set([...state.wiki.expandedFolders, payload.id])]
			saveToLocalStorage(state)
		},
		uncollapseWikiFolderById: (state, { payload }: PayloadAction<string>) => {
			state.wiki.expandedFolders = [...new Set([...state.wiki.expandedFolders, payload])]
			saveToLocalStorage(state)
		},
		setVisibleWikiEntities: (
			state,
			{ payload }: PayloadAction<PreferencesState['wiki']['visibleEntities']>,
		) => {
			state.wiki.visibleEntities = payload
			saveToLocalStorage(state)
		},

		/* Image Generator */
		setImageGeneratorPrompt: (state, { payload }: PayloadAction<string>) => {
			state.imageGenerator.lastPrompt = payload
			saveToLocalStorage(state)
		},
	},
})

export type PreferencesState = typeof initialState
export const preferencesInitialState = initialState

export const PreferencesReducer = preferencesSlice.reducer
