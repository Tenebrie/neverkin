import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import {
	useMindmapContext,
	useMindmapSelectionContext,
} from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { WirePaint } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapWireBuffer'

type Props = {
	wireId: string
	paint: WirePaint
	onOpenPopover: (params: {
		wireId: string
		position: { x: number; y: number }
		mode: 'doubleClick' | 'contextMenu'
	}) => void
}

export function useMindmapWireInteraction({ wireId, paint, onOpenPopover }: Props) {
	const { wireBuffer } = useMindmapContext()
	const { selectedWires, addWireToSelection, removeWireFromSelection, addWireToHover, removeWireFromHover } =
		useMindmapSelectionContext()

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

	useLayoutEffect(() => {
		if (selectedWires.has(wireId)) {
			selectedRef.current = true
			applyVisualState()
		}
		return selectedWires.subscribe(wireId, () => {
			selectedRef.current = selectedWires.has(wireId)
			applyVisualState()
		})
	}, [applyVisualState, selectedWires, wireId])

	const { triggerClick } = useDoubleClick<{ multiselect: boolean; event: React.MouseEvent }>({
		onClick: ({ multiselect }) => {
			if (selectedRef.current) {
				removeWireFromSelection(wireId)
			} else {
				addWireToSelection({ wireId, multiselect })
			}
		},
		onDoubleClick: ({ event, multiselect }) => {
			addWireToSelection({ wireId, multiselect })
			onOpenPopover({ wireId, position: { x: event.clientX, y: event.clientY }, mode: 'doubleClick' })
		},
		ignoreDelay: true,
	})

	const { onMouseDown, onMouseUp } = useDraggableClick({
		onRightClick: (event) => {
			addWireToSelection({ wireId, multiselect: isMultiselectEvent(event) })
			onOpenPopover({ wireId, position: { x: event.clientX, y: event.clientY }, mode: 'contextMenu' })
		},
	})

	const onClick = (event: React.MouseEvent) =>
		triggerClick(event, { multiselect: isMultiselectEvent(event), event })

	const pathProps = {
		onClick,
		onMouseEnter: () => {
			isHoveredRef.current = true
			addWireToHover(wireId)
			applyVisualState()
		},
		onMouseLeave: () => {
			isHoveredRef.current = false
			isActiveRef.current = false
			removeWireFromHover(wireId)
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

	useEffect(
		() => () => {
			removeWireFromHover(wireId)
		},
		[removeWireFromHover, wireId],
	)

	const labelProps = { onClick, onMouseDown, onMouseUp }

	return { pathProps, labelProps }
}
