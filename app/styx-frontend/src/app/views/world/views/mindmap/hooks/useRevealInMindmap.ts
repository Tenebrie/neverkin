import { useCallback } from 'react'
import { useDispatch, useStore } from 'react-redux'

import { mindmapApi } from '@/api/mindmapApi'
import { MindmapNode } from '@/api/types/mindmapTypes'
import { useEventBusDispatch } from '@/app/features/eventBus'
import { AppDispatch, RootState } from '@/app/store'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { mindmapSlice } from '../MindmapSlice'
import { getMindmapNodeCenter } from '../utils/getMindmapNodeCenter'
import { getMindmapNodeParentId } from '../utils/getMindmapNodeParentId'
import { getMindmapViewCenter } from '../utils/getMindmapViewCenter'

const CENTERED_TOLERANCE = 1

/**
 * Reveals the entity's node on the mindmap. With several nodes, each call moves on from the node the camera
 * is currently centered on to the next one. Reads its inputs at call time so it never re-renders the caller.
 */
export function useRevealInMindmap(entity: BoxedWikiEntity) {
	const store = useStore<RootState>()
	const lookAt = useEventBusDispatch['mindmap/camera/requestLookAt']()
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const dispatch = useDispatch<AppDispatch>()

	return useCallback(async () => {
		const viewCenter = getMindmapViewCenter()
		const worldId = getWorldIdState(store.getState())
		const { data } = await dispatch(
			mindmapApi.endpoints.getMindmap.initiate({ worldId }, { subscribe: false }),
		)
		const entityNodes = data?.nodes.filter((node) => getMindmapNodeParentId(node) === entity.id) ?? []
		const target = pickNextNode(entityNodes, viewCenter)
		if (!target) {
			return
		}
		if (viewCenter) {
			lookAt(getMindmapNodeCenter(target))
			return
		}
		dispatch(mindmapSlice.actions.setPendingReveal(target.id))
		navigate({ to: '/world/$worldId/mindmap', search: true })
	}, [store, entity.id, lookAt, dispatch, navigate])
}

function pickNextNode(
	nodes: MindmapNode[],
	viewCenter: { x: number; y: number } | null,
): MindmapNode | undefined {
	if (nodes.length === 0 || !viewCenter) {
		return nodes[0]
	}
	const ordered = nodes.toSorted((a, b) => a.positionX - b.positionX || a.positionY - b.positionY)
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
