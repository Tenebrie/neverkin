import { RefObject, useLayoutEffect, useRef } from 'react'

import { useGetMindmapQuery } from '@/api/mindmapApi'
import { useEventBusDispatch } from '@/app/features/eventBus'
import { useStrictParams } from '@/router-utils/hooks/useStrictParams'

import { getMindmapContentBounds } from '../utils/getMindmapContentBounds'

const FIT_PADDING = 64

/**
 * Points the camera at the existing nodes once the mindmap first loads. `enabled` is read on mount only.
 */
export function useMindmapInitialFocus(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
	const { worldId } = useStrictParams({ from: '/world/$worldId/_world' })
	const { data } = useGetMindmapQuery({ worldId })
	const lookAt = useEventBusDispatch['mindmap/camera/requestLookAt']()
	const pending = useRef(enabled)

	useLayoutEffect(() => {
		const element = ref.current
		if (!data || !pending.current || !element) {
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
	}, [data, ref, lookAt])
}
