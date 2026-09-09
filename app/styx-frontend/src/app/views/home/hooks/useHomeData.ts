import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useListCalendarsQuery } from '@/api/calendarApi'
import { WorldBrief } from '@/api/types/worldTypes'
import { getHomePreferences } from '@/app/features/preferences/PreferencesSliceSelectors'

import { useWorldListData } from '../../worldManagement/hooks/useWorldListData'

export type RecentActivity = {
	id: string
	name: string
	type: 'world' | 'calendar'
	updatedAt: string
}

export type SharedWorld = WorldBrief & { role: string }

const byRecency = (a: { updatedAt: string }, b: { updatedAt: string }) =>
	new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()

const pinnedFirst = <T extends WorldBrief>(worlds: T[], pinnedWorlds: string[]): T[] =>
	[...worlds].sort(
		(a, b) => Number(pinnedWorlds.includes(b.id)) - Number(pinnedWorlds.includes(a.id)) || byRecency(a, b),
	)

export function useHomeData() {
	const { ownedWorlds, contributableWorlds, visibleWorlds, isLoading: isWorldsLoading } = useWorldListData()
	const { data: calendars, isLoading: isCalendarsLoading } = useListCalendarsQuery(undefined, {
		refetchOnMountOrArgChange: true,
	})
	const { pinnedWorlds } = useSelector(getHomePreferences)

	const allSharedWorlds = useMemo<SharedWorld[]>(
		() => [
			...contributableWorlds.map((world) => ({ ...world, role: 'Can edit' })),
			...visibleWorlds.map((world) => ({ ...world, role: 'Read only' })),
		],
		[contributableWorlds, visibleWorlds],
	)

	const recentActivity = useMemo(
		() =>
			[
				...ownedWorlds.map((world) => ({ ...world, type: 'world' as const })),
				...allSharedWorlds.map((world) => ({ ...world, type: 'world' as const })),
				...(calendars ?? []).map((calendar) => ({ ...calendar, type: 'calendar' as const })),
			]
				.sort(byRecency)
				.slice(0, 10)
				.map<RecentActivity>(({ id, name, type, updatedAt }) => ({ id, name, type, updatedAt })),
		[ownedWorlds, allSharedWorlds, calendars],
	)

	const sortedOwnedWorlds = useMemo(() => pinnedFirst(ownedWorlds, pinnedWorlds), [ownedWorlds, pinnedWorlds])
	const sortedSharedWorlds = useMemo(
		() => pinnedFirst(allSharedWorlds, pinnedWorlds),
		[allSharedWorlds, pinnedWorlds],
	)
	const sortedCalendars = useMemo(() => [...(calendars ?? [])].sort(byRecency), [calendars])

	return {
		isLoading: isWorldsLoading || isCalendarsLoading,
		ownedWorlds: sortedOwnedWorlds,
		sharedWorlds: sortedSharedWorlds,
		calendars: sortedCalendars,
		recentActivity,
		totals: {
			owned: ownedWorlds.length,
			shared: allSharedWorlds.length,
			calendars: calendars?.length ?? 0,
		},
	}
}
