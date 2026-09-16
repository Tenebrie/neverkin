import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { z } from 'zod'

import usePersistentState from '@/app/hooks/usePersistentState'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

const MAX_ENTRIES = 20

const RecentlyOpenedSchema = z.array(
	z.object({
		worldId: z.string(),
		entityId: z.string(),
		openedAt: z.number(),
	}),
)

export function useRecentlyOpened() {
	const worldId = useSelector(getWorldIdState)
	const [entries, setEntries] = usePersistentState(
		'wikiRecentlyOpened',
		RecentlyOpenedSchema,
		[],
		sessionStorage,
	)

	const record = useCallback(
		(entityId: string) => {
			setEntries((current) =>
				[
					{ worldId, entityId, openedAt: Date.now() },
					...current.filter((entry) => entry.entityId !== entityId),
				].slice(0, MAX_ENTRIES),
			)
		},
		[setEntries, worldId],
	)

	return {
		entries: entries.filter((entry) => entry.worldId === worldId),
		record,
	}
}
