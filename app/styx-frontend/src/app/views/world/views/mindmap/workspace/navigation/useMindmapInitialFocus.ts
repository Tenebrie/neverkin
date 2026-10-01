import { useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useGetMindmapQuery } from '@/api/mindmapApi'
import { useEventBusDispatch } from '@/app/features/eventBus'
import { RootState } from '@/app/store'

import { useCurrentWorldId } from '../../../../hooks/useCurrentWorldId'
import { useMindmapContext } from '../../context/useMindmapContext'
import { mindmapSlice } from '../../MindmapSlice'
import { getMindmapNodeCenter } from '../../utils/getMindmapNodeCenter'
import { getMindmapContentBounds } from './getMindmapContentBounds'
import { useMindmapCameraPersistence } from './useMindmapCameraPersistence'
import { MIN_SCALE } from './useMindmapNavigation'

const FIT_PADDING = 64

export function useMindmapInitialFocus() {
	const worldId = useCurrentWorldId()
	const { data } = useGetMindmapQuery({ worldId })
	const revealNodeId = useSelector((state: RootState) => state.mindmap.pendingRevealNodeId)
	const dispatch = useDispatch()
	const lookAt = useEventBusDispatch['mindmap/camera/requestLookAt']()

	const [state] = useMindmapCameraPersistence()

	const pending = useRef(!state.current.worldId)

	const { workspaceRect } = useMindmapContext()

	useLayoutEffect(() => {
		if (!data || !revealNodeId) {
			return
		}

		const node = data.nodes.find((node) => node.id === revealNodeId)
		if (node) {
			pending.current = false
			lookAt(getMindmapNodeCenter(node))
		}
		dispatch(mindmapSlice.actions.setPendingReveal(null))
	}, [data, dispatch, lookAt, revealNodeId])

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
