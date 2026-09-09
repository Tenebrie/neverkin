import { useCallback, useRef } from 'react'

import { useEventBusDispatch, useEventBusSubscribe } from '@/app/features/eventBus'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'
import { TimelineState } from '@/app/views/world/views/timeline/utils/TimelineState'

type Props = {
	containerWidth: number
}

/**
 * Lightweight scroll handler for the preview anchor.
 * Listens for requestScrollTo on the (isolated) event bus,
 * updates TimelineState.scroll, and re-dispatches timeline/onScroll.
 */
export function PreviewScrollHandler({ containerWidth }: Props) {
	const scrollRef = useRef(0)
	const dispatchOnScroll = useEventBusDispatch['timeline/onScroll']()

	const setScroll = useCallback(
		(value: number) => {
			scrollRef.current = value
			TimelineState.scroll = value
			dispatchOnScroll(value)
		},
		[dispatchOnScroll],
	)

	useEffectOnce(() => {
		setScroll(containerWidth / 2)
	})

	useEventBusSubscribe['timeline/requestScrollTo']({
		callback: (params) => {
			if ('rawScrollValue' in params) {
				setScroll(params.rawScrollValue)
			}
		},
	})

	return null
}
