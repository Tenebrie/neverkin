import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { SplitMindmapWireApiArg, useSplitMindmapWireMutation } from '@/api/mindmapApi'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

export function useSplitMindmapWire() {
	const worldId = useSelector(getWorldIdState)
	const [splitMindmapWire, state] = useSplitMindmapWireMutation()

	const perform = useCallback(
		async (wireId: string, body: SplitMindmapWireApiArg['body']) => {
			const { response, error } = parseApiResponse(await splitMindmapWire({ worldId, wireId, body }))
			if (error) {
				return
			}
			return response
		},
		[splitMindmapWire, worldId],
	)

	return [perform, state] as const
}
