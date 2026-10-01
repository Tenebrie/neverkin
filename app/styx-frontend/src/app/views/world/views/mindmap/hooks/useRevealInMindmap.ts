import { useDispatch } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { useLazyGetMindmapQuery } from '@/api/mindmapApi'
import { MindmapNode } from '@/api/types/mindmapTypes'
import { useEventBusDispatch } from '@/app/features/eventBus'
import { AppDispatch } from '@/app/store'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { mindmapSlice } from '../MindmapSlice'
import { MindmapState } from '../MindmapState'
import { getMindmapNodeCenter } from '../utils/getMindmapNodeCenter'
import { getMindmapNodeParentId } from '../utils/getMindmapNodeParentId'
import { toWorkspaceCoords } from '../utils/toWorkspaceCoords'

const CENTERED_TOLERANCE = 1

export function useRevealInMindmap(entity: BoxedWikiEntity) {
	const worldId = useCurrentWorldId()
	const lookAt = useEventBusDispatch['mindmap/camera/requestLookAt']()
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const dispatch = useDispatch<AppDispatch>()
	const [getMindmapData] = useLazyGetMindmapQuery()

	return useEvent(async () => {
		const { data } = await getMindmapData({ worldId }, true)
		if (!data) {
			return
		}

		const entityNodes = data.nodes.filter((node) => getMindmapNodeParentId(node) === entity.id)
		if (entityNodes.length === 0) {
			return
		}

		const { workspaceRect } = MindmapState
		if (!workspaceRect) {
			const targetNode = entityNodes[0]
			dispatch(mindmapSlice.actions.setPendingReveal(targetNode.id))
			navigate({ to: '/world/$worldId/mindmap', search: true })
			return
		}

		const viewCenter = toWorkspaceCoords({
			screenX: workspaceRect.x + workspaceRect.width / 2,
			screenY: workspaceRect.y + workspaceRect.height / 2,
		})

		if (viewCenter) {
			const target = pickNextNode(entityNodes, viewCenter)
			lookAt(getMindmapNodeCenter(target))
		}
	})
}

function pickNextNode(nodes: MindmapNode[], viewCenter: { x: number; y: number }): MindmapNode {
	const ordered = nodes.toSorted((a, b) => {
		return a.positionX - b.positionX || a.positionY - b.positionY
	})

	const distances = ordered.map((node) => {
		const center = getMindmapNodeCenter(node)
		return Math.hypot(center.x - viewCenter.x, center.y - viewCenter.y)
	})
	const nearest = distances.indexOf(Math.min(...distances))
	if (distances[nearest] > CENTERED_TOLERANCE) {
		return ordered[nearest]
	}
	return ordered[(nearest + 1) % ordered.length]
}
