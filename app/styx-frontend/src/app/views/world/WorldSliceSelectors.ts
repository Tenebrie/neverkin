import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../../store'

export const getWorldState = (state: RootState) => state.world
export const getSelectedMarkerKeys = createSelector([getWorldState], (state) =>
	state.selectedTimelineMarkers.map((marker) => marker.key),
)
export const getWorldStateLoaded = createSelector([getWorldState], (state) => state.isLoaded)
export const getWorldIdState = createSelector([getWorldState], (state) => state.id)
export const getWorldRouterState = createSelector([getWorldState], (state) => ({
	id: state.id,
	isReadOnly: state.isReadOnly,
}))
export const getEventDescriptionRich = (eventId: string) => (state: RootState) =>
	state.world.events.find((event) => event.id === eventId)?.contentRich ?? ''
export const getEventCreatorState = (state: RootState) => state.world.eventCreator
export const getTimelineContextMenuState = (state: RootState) => state.world.timelineContextMenu
export const getTimelineState = (state: RootState) => state.timeline
