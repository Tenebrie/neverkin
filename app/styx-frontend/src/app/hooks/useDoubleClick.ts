import { useCallback, useRef } from 'react'
import { MouseEvent as ReactMouseEvent } from 'react'
import useEvent from 'react-use-event-hook'

type Props<ArgsT> = {
	onClick: (args: ArgsT) => void
	onDoubleClick: (args: ArgsT) => void
	ignoreDelay?: boolean
}

export const useDoubleClick = <ArgsT>({ onClick, onDoubleClick, ignoreDelay }: Props<ArgsT>) => {
	const singleClickTimeout = useRef<number>(0)
	const singleClickArguments = useRef<ArgsT | null>(null)
	const lastClickTimestampRef = useRef<number>(0)
	const lastClickTargetRef = useRef<EventTarget | null>(null)

	const onSingleClickTimeout = useCallback(() => {
		onClick(singleClickArguments.current as ArgsT)
	}, [onClick])

	const triggerClick = useEvent((event: MouseEvent | ReactMouseEvent, args: ArgsT) => {
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

	return {
		triggerClick,
	}
}
