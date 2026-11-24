import { useDispatch } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { AppDispatch } from '@/app/store'
import { useCurrentWorldIdOptional } from '@/app/views/world/hooks/useCurrentWorldIdOptional'
import { mindmapSlice } from '@/app/views/world/views/mindmap/MindmapSlice'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

type Props = {
	id: string
	worldId: string
}

export function useGlobalRevealInMindmap({ id, worldId }: Props) {
	const currentWorldId = useCurrentWorldIdOptional()
	const navigate = useStableNavigate({})
	const dispatch = useDispatch<AppDispatch>()

	return useEvent(() => {
		dispatch(
			mindmapSlice.actions.setPendingReveal({
				worldId,
				entityId: id,
			}),
		)
		const isRightWorld = currentWorldId === worldId
		if (MindmapState.workspaceRect && isRightWorld) {
			return
		}

		navigate({
			to: '/world/$worldId/mindmap',
			params: { worldId },
			search: isRightWorld ? true : {},
		})
	})
}
