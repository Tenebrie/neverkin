import { useCallback } from 'react'

import { PasteMindmapNodesApiArg, usePasteMindmapNodesMutation } from '@/api/mindmapApi'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

export function usePasteMindmapNodes() {
	const worldId = useCurrentWorldId()
	const [pasteMindmapNodes, state] = usePasteMindmapNodesMutation()

	const perform = useCallback(
		async (body: PasteMindmapNodesApiArg['body']) => {
			const { response, error } = parseApiResponse(
				await pasteMindmapNodes({
					worldId,
					body,
				}),
			)
			if (error) {
				return
			}
			return response
		},
		[pasteMindmapNodes, worldId],
	)

	return [perform, state] as const
}
