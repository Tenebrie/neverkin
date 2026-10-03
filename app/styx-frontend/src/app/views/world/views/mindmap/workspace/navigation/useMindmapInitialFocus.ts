import { useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useGetMindmapQuery } from '@/api/mindmapApi'
import { MindmapNode } from '@/api/types/mindmapTypes'
import { useEventBusDispatch } from '@/app/features/eventBus'
import { RootState } from '@/app/store'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

import { useMindmapContext } from '../../context/useMindmapContext'
import { mindmapSlice } from '../../MindmapSlice'
import { getLayoutCenter, resolveNodeLayout } from '../../unrefactored/mindmapWireUtils'
import { getMindmapNodeParentId } from '../../utils/getMindmapNodeParentId'
import { toWorkspaceCoords } from '../../utils/toWorkspaceCoords'
import { getMindmapContentBounds } from './getMindmapContentBounds'
import { useMindmapCameraPersistence } from './useMindmapCameraPersistence'
import { MIN_SCALE } from './useMindmapNavigation'

const FIT_PADDING = 64
const CENTERED_TOLERANCE = 1

export function useMindmapInitialFocus() {
	const worldId = useCurrentWorldId()
	const { data } = useGetMindmapQuery({ worldId })
	const revealEntityId = useSelector((state: RootState) => state.mindmap.pendingRevealEntityId)
	const dispatch = useDispatch()
	const lookAt = useEventBusDispatch['mindmap/camera/requestLookAt']()

	const [state] = useMindmapCameraPersistence()

	const pending = useRef(!state.current.worldId)

	const { workspaceRect, nodeLayouts } = useMindmapContext()

	useLayoutEffect(() => {
		if (!data || !revealEntityId) {
			return
		}

		const entityNodes = data.nodes.filter((node) => getMindmapNodeParentId(node) === revealEntityId)
		const viewCenter = toWorkspaceCoords({
			screenX: workspaceRect.x + workspaceRect.width / 2,
			screenY: workspaceRect.y + workspaceRect.height / 2,
		})
		if (entityNodes.length > 0 && viewCenter) {
			const getCenter = (node: MindmapNode) => getLayoutCenter(resolveNodeLayout(nodeLayouts, node))
			pending.current = false
			lookAt(getCenter(pickNextNode(entityNodes, viewCenter, getCenter)))
		}
		dispatch(mindmapSlice.actions.setPendingReveal(null))
	}, [data, dispatch, lookAt, revealEntityId, nodeLayouts, workspaceRect])

	useLayoutEffect(() => {
		if (!data || !pending.current) {
			return
		}

		pending.current = false
		const contentBounds = getMindmapContentBounds(data.nodes)
		if (!contentBounds) {
			return
		}
		const { size, center, interestingPoint } = contentBounds
		const fitScale = Math.min(
			(workspaceRect.width - 2 * FIT_PADDING) / size.width,
			(workspaceRect.height - 2 * FIT_PADDING) / size.height,
		)

		const scale = Math.min(1, fitScale)
		// If the bounding box does not fit, look at a good sample point
		if (scale < MIN_SCALE) {
			lookAt({ ...interestingPoint, scale })
		} else {
			lookAt({ ...center, scale })
		}
	}, [data, lookAt, workspaceRect])
}

function pickNextNode(
	nodes: MindmapNode[],
	viewCenter: { x: number; y: number },
	getCenter: (node: MindmapNode) => { x: number; y: number },
): MindmapNode {
	const ordered = nodes.toSorted((a, b) => {
		return a.positionX - b.positionX || a.positionY - b.positionY
	})

	const distances = ordered.map((node) => {
		const center = getCenter(node)
		return Math.hypot(center.x - viewCenter.x, center.y - viewCenter.y)
	})
	const nearest = distances.indexOf(Math.min(...distances))
	if (distances[nearest] > CENTERED_TOLERANCE) {
		return ordered[nearest]
	}
	return ordered[(nearest + 1) % ordered.length]
}
