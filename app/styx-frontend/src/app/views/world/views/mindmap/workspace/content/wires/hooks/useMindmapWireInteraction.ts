import { useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'
import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { mindmapSlice } from '@/app/views/world/views/mindmap/MindmapSlice'
import { WirePaint } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapWireBuffer'

type Props = {
	wireId: string
	paint: WirePaint
	onOpenPopover: (position: { x: number; y: number }, mode: 'doubleClick' | 'contextMenu') => void
}

export function useMindmapWireInteraction({ wireId, paint, onOpenPopover }: Props) {
	const { wireBuffer } = useMindmapContext()
	const dispatch = useDispatch()
	const { addWireToSelection, removeWireFromSelection, addWireToHover, removeWireFromHover } =
		mindmapSlice.actions

	const isHoveredRef = useRef(false)
	const isActiveRef = useRef(false)
	const selectedRef = useRef(false)

	const applyVisualState = useCallback(() => {
		const isSel = selectedRef.current
		const isHov = isHoveredRef.current
		const isAct = isActiveRef.current

		paint.glowOpacity = isSel ? 0.7 : isHov || isAct ? 0.4 : 0.12
		paint.isActive = isAct
		wireBuffer.publish(wireId, paint)
	}, [paint, wireId, wireBuffer])

	useEventBusSubscribe['mindmap/selection/changed']({
		callback: ({ selectedWireIds }) => {
			selectedRef.current = selectedWireIds.has(wireId)
			applyVisualState()
		},
	})

	const { triggerClick } = useDoubleClick<{ multiselect: boolean; event: React.MouseEvent }>({
		onClick: ({ multiselect }) => {
			if (selectedRef.current) {
				dispatch(removeWireFromSelection(wireId))
			} else {
				dispatch(addWireToSelection({ wireId, multiselect }))
			}
		},
		onDoubleClick: ({ event, multiselect }) => {
			onOpenPopover({ x: event.clientX, y: event.clientY }, 'doubleClick')
			dispatch(addWireToSelection({ wireId, multiselect }))
		},
		ignoreDelay: true,
	})

	const { onMouseDown, onMouseUp } = useDraggableClick({
		onRightClick: (event) => {
			onOpenPopover({ x: event.clientX, y: event.clientY }, 'contextMenu')
			dispatch(addWireToSelection({ wireId, multiselect: event.shiftKey }))
		},
	})

	const onClick = (event: React.MouseEvent) => triggerClick(event, { multiselect: event.shiftKey, event })

	const pathProps = {
		onClick,
		onMouseEnter: () => {
			isHoveredRef.current = true
			dispatch(addWireToHover(wireId))
			applyVisualState()
		},
		onMouseLeave: () => {
			isHoveredRef.current = false
			isActiveRef.current = false
			dispatch(removeWireFromHover(wireId))
			applyVisualState()
		},
		onMouseDown: () => {
			isActiveRef.current = true
			applyVisualState()
			onMouseDown()
		},
		onMouseUp: (event: React.MouseEvent) => {
			isActiveRef.current = false
			applyVisualState()
			onMouseUp(event)
		},
	}

	const labelProps = { onClick, onMouseDown, onMouseUp }

	return { pathProps, labelProps }
}
