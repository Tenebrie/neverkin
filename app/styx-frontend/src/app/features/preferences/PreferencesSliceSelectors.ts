import { createSelector } from '@reduxjs/toolkit'

import { RootState } from '../../store'

const getRootPreferences = (state: RootState) => state.preferences

export const getAdminPreferences = (state: RootState) => state.preferences.admin
export const getGlobalPreferences = (state: RootState) => state.preferences.global
export const getCalendarEditorPreferences = (state: RootState) => state.preferences.calendarEditor
export const getUserPreferences = createSelector([getRootPreferences], (state) => ({
	colorMode: state.colorMode,
}))
export const getHomePreferences = (state: RootState) => state.preferences.home
export const getIconSetPreferences = (state: RootState) => state.preferences.iconSets
export const getOutlinerPreferences = (state: RootState) => state.preferences.outliner
export const getOverviewPreferences = (state: RootState) => state.preferences.overview
export const getTimelinePreferences = (state: RootState) => state.preferences.timeline
export const getWikiPreferences = (state: RootState) => state.preferences.wiki
