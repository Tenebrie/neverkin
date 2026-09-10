import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import { iconifyApi, IconifyApiReducer } from '@/api/iconify/iconifyApi'

import { baseApi, BaseApiReducer } from '../api/base/baseApi'
import { AuthReducer } from './features/auth/AuthSlice'
import { globalEventBus } from './features/eventBus/eventBus'
import { ModalsReducer } from './features/modals/ModalsSlice'
import { PreferencesReducer } from './features/preferences/PreferencesSlice'
import { CalendarEditorReducer } from './features/time/calendar/CalendarSlice'
import { UndoRedoReducer } from './features/undoRedo/UndoRedoSlice'
import { deepMerge } from './utils/deepMerge'
import { MindmapReducer } from './views/world/views/mindmap/MindmapSlice'
import { TimelineReducer } from './views/world/views/timeline/TimelineSlice'
import { WikiReducer } from './views/world/views/wiki/WikiSlice'
import { WorldReducer } from './views/world/WorldSlice'

const rootReducer = combineReducers({
	api: BaseApiReducer,
	iconifyApi: IconifyApiReducer,

	calendarEditor: CalendarEditorReducer,

	auth: AuthReducer,
	mindmap: MindmapReducer,
	modals: ModalsReducer,
	world: WorldReducer,
	preferences: PreferencesReducer,
	timeline: TimelineReducer,
	wiki: WikiReducer,
	undoRedo: UndoRedoReducer,
})

export const generateStore = ({ preloadedState }: { preloadedState?: Partial<RootState> } = {}) => {
	const initialState = rootReducer(undefined, { type: '' })
	return configureStore({
		reducer: rootReducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(baseApi.middleware, iconifyApi.middleware),
		preloadedState: deepMerge(initialState, preloadedState ?? {}),
	})
}

export const store = generateStore()
export const getGlobalStore = () => store

setupListeners(store.dispatch, (dispatch, { onOnline }) =>
	globalEventBus.on('calliope/onReconnected', ({ isReconnect }) => {
		if (isReconnect) {
			dispatch(onOnline())
		}
	}),
)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
