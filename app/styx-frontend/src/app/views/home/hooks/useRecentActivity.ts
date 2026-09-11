import { useMemo } from 'react'

import { recentFirst } from '@/app/utils/sorting/recentFirst'

import { useWorldListData } from '../../worldManagement/hooks/useWorldListData'
import { useCalendarListData } from './useCalendarListData'

export type RecentActivity = {
	id: string
	name: string
	type: 'world' | 'calendar'
	updatedAt: string
}

export function useRecentActivity() {
	const { ownedWorlds, contributableWorlds, visibleWorlds, isLoading: isWorldsLoading } = useWorldListData()
	const { calendars, isLoading: isCalendarsLoading } = useCalendarListData()

	const recentActivity = useMemo(
		() =>
			[
				...ownedWorlds.map((world) => ({ ...world, type: 'world' as const })),
				...contributableWorlds.map((world) => ({ ...world, type: 'world' as const })),
				...visibleWorlds.map((world) => ({ ...world, type: 'world' as const })),
				...(calendars ?? []).map((calendar) => ({ ...calendar, type: 'calendar' as const })),
			]
				.sort(recentFirst)
				.slice(0, 10)
				.map<RecentActivity>(({ id, name, type, updatedAt }) => ({ id, name, type, updatedAt })),
		[ownedWorlds, contributableWorlds, visibleWorlds, calendars],
	)

	return {
		activities: recentActivity,
		isLoading: isWorldsLoading || isCalendarsLoading,
	}
}
