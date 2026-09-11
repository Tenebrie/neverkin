import { RefObject, useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useGetMindmapQuery } from '@/api/mindmapApi'
import { useEventBusDispatch } from '@/app/features/eventBus'
import { RootState } from '@/app/store'
import { useStrictParams } from '@/router-utils/hooks/useStrictParams'

import { mindmapSlice } from '../MindmapSlice'
import { getMindmapContentBounds } from '../utils/getMindmapContentBounds'
import { getMindmapNodeCenter } from '../utils/getMindmapNodeCenter'

const FIT_PADDING = 64

/**
 * Points the camera at the node a reveal from another view asked for, or at the existing nodes once the mindmap
 * first loads. `enabled` is read on mount only.
 */
export function useMindmapInitialFocus(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
	const { worldId } = useStrictParams({ from: '/world/$worldId/_world' })
	const { data } = useGetMindmapQuery({ worldId })
	const revealNodeId = useSelector((state: RootState) => state.mindmap.pendingRevealNodeId)
	const dispatch = useDispatch()
	const lookAt = useEventBusDispatch['mindmap/camera/requestLookAt']()
	const pending = useRef(enabled)

	useLayoutEffect(() => {
		const element = ref.current
		if (!data || !element) {
			return
		}
		if (revealNodeId) {
			const node = data.nodes.find((node) => node.id === revealNodeId)
			if (node) {
				pending.current = false
				lookAt(getMindmapNodeCenter(node))
			}
			dispatch(mindmapSlice.actions.setPendingReveal(null))
			return
		}
		if (!pending.current) {
			return
		}
		pending.current = false
		const bounds = getMindmapContentBounds(data.nodes)
		if (!bounds) {
			return
		}
		const { width, height } = element.getBoundingClientRect()
		lookAt({
			x: (bounds.minX + bounds.maxX) / 2,
			y: (bounds.minY + bounds.maxY) / 2,
			scale: Math.min(
				1,
				(width - 2 * FIT_PADDING) / (bounds.maxX - bounds.minX),
				(height - 2 * FIT_PADDING) / (bounds.maxY - bounds.minY),
			),
		})
	}, [data, ref, lookAt, revealNodeId, dispatch])
}
