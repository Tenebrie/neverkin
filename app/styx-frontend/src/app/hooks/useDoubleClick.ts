import { useCallback, useEffect, useRef } from 'react'
import { MouseEvent as ReactMouseEvent } from 'react'
import useEvent from 'react-use-event-hook'

import { useMousePositionRef } from './useMousePositionRef'

type Props<ArgsT> = {
	onClick: (args: ArgsT) => void
	onDoubleClick: (args: ArgsT) => void
	onLongClick?: (args: ArgsT) => void
	ignoreDelay?: boolean
}

const LONG_CLICK_DELAY = 500
const LONG_CLICK_TOLERANCE = 5

export const useDoubleClick = <ArgsT>({ onClick, onDoubleClick, onLongClick, ignoreDelay }: Props<ArgsT>) => {
	const singleClickTimeout = useRef<number>(0)
	const singleClickArguments = useRef<ArgsT | null>(null)
	const lastClickTimestampRef = useRef<number>(0)
	const lastClickTargetRef = useRef<EventTarget | null>(null)
	const mousePosition = useMousePositionRef()
	const longClickTimeout = useRef<number>(0)
	const longClickFired = useRef(false)

	const onSingleClickTimeout = useCallback(() => {
		onClick(singleClickArguments.current as ArgsT)
	}, [onClick])

	const triggerClick = useEvent((event: MouseEvent | ReactMouseEvent, args: ArgsT) => {
		if (longClickFired.current) {
			longClickFired.current = false
			return
		}
		const time = Date.now()
		const lastClickTime = lastClickTimestampRef.current
		const lastClickTarget = lastClickTargetRef.current
		lastClickTimestampRef.current = time
		lastClickTargetRef.current = event.target
		if (time - lastClickTime < 300 && lastClickTarget === event.target) {
			lastClickTimestampRef.current = 0
			lastClickTargetRef.current = null
			onDoubleClick(args)
			window.clearTimeout(singleClickTimeout.current)
			return
		}
		if (ignoreDelay) {
			onClick(args)
		} else {
			singleClickTimeout.current = window.setTimeout(onSingleClickTimeout, 300)
			singleClickArguments.current = args
		}
	})

	const startLongClick = useEvent((event: MouseEvent | ReactMouseEvent, args: ArgsT) => {
		longClickFired.current = false
		if (!onLongClick || event.button !== 0) {
			return
		}
		const startX = event.clientX
		const startY = event.clientY
		window.clearTimeout(longClickTimeout.current)
		longClickTimeout.current = window.setTimeout(() => {
			const { x, y } = mousePosition.current
			if (Math.abs(x - startX) > LONG_CLICK_TOLERANCE || Math.abs(y - startY) > LONG_CLICK_TOLERANCE) {
				return
			}
			longClickFired.current = true
			onLongClick(args)
		}, LONG_CLICK_DELAY)
	})

	const cancelLongClick = useEvent(() => {
		window.clearTimeout(longClickTimeout.current)
	})

	useEffect(() => cancelLongClick, [cancelLongClick])

	return {
		triggerClick,
		startLongClick,
		cancelLongClick,
	}
}
