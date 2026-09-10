import { useMemo } from 'react'

import { useListCalendarsQuery } from '@/api/calendarApi'
import { WorldBrief } from '@/api/types/worldTypes'

import { useWorldListData } from '../../worldManagement/hooks/useWorldListData'

export type RecentActivity = {
	id: string
	name: string
	type: 'world' | 'calendar'
	updatedAt: string
}

export type SharedWorld = WorldBrief & { role: string }

export function useHomeData() {
	const { ownedWorlds, contributableWorlds, visibleWorlds, isLoading: isWorldsLoading } = useWorldListData()
	const { data: calendars, isLoading: isCalendarsLoading } = useListCalendarsQuery(undefined, {
		refetchOnMountOrArgChange: true,
	})

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

	const sortedOwnedWorlds = useMemo(() => pinnedFirst(ownedWorlds), [ownedWorlds])
	const sortedSharedWorlds = useMemo(() => pinnedFirst(allSharedWorlds), [allSharedWorlds])
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

function byRecency(a: { updatedAt: string }, b: { updatedAt: string }) {
	return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function pinnedFirst<T extends WorldBrief>(worlds: T[]): T[] {
	const pinRank = (world: WorldBrief) => {
		if (world.userPins.length === 0) {
			return 10000
		}
		return world.userPins[0].rank
	}
	return [...worlds].sort((a, b) => pinRank(a) - pinRank(b) || byRecency(a, b))
}
