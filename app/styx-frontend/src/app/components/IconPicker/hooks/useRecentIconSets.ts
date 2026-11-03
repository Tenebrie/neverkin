import { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { preferencesSlice } from '@/app/features/preferences/PreferencesSlice'
import { getIconSetPreferences } from '@/app/features/preferences/PreferencesSliceSelectors'

export function useRecentIconSets() {
	const { recent } = useSelector(getIconSetPreferences, (a, b) => a.recent === b.recent)

	const recentSnapshot = useRef(recent)

	const dispatch = useDispatch()
	const { setRecentIconSets } = preferencesSlice.actions

	const updateRecentIconSets = useEvent((newIconSets: string[]) => {
		const filteredIconSets = Array.from(new Set([...newIconSets, ...recent])).slice(0, 24)
		dispatch(setRecentIconSets(filteredIconSets))
	})

	return [recentSnapshot.current, updateRecentIconSets] as const
}
