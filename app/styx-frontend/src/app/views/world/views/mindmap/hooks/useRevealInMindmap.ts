import { useDispatch } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { useLazyGetMindmapQuery } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { mindmapSlice } from '../MindmapSlice'
import { MindmapState } from '../MindmapState'
import { getMindmapNodeParentId } from '../utils/getMindmapNodeParentId'

export function useRevealInMindmap(entity: BoxedWikiEntity) {
	const worldId = useCurrentWorldId()
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const dispatch = useDispatch<AppDispatch>()
	const [getMindmapData] = useLazyGetMindmapQuery()

	return useEvent(async () => {
		const { data } = await getMindmapData({ worldId }, true)
		if (!data || !data.nodes.some((node) => getMindmapNodeParentId(node) === entity.id)) {
			return
		}

		dispatch(mindmapSlice.actions.setPendingReveal(entity.id))
		if (!MindmapState.workspaceRect) {
			navigate({ to: '/world/$worldId/mindmap', search: true })
		}
	})
}
