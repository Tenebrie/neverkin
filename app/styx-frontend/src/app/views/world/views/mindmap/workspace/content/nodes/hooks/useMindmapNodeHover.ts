import { useEffect, useRef } from 'react'
import useEvent from 'react-use-event-hook'

import { useMindmapSelectionContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'

type Props = {
	nodeId: string
}

export function useMindmapNodeHover({ nodeId }: Props) {
	const { addNodeToHover, removeNodeFromHover } = useMindmapSelectionContext()
	const isDraggingRef = useRef(false)
	const isHoverSuppressedRef = useRef(false)
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const setHovered = useEvent((isHovered: boolean, delay: number) => {
		clearTimeout(hoverTimeoutRef.current ?? undefined)
		hoverTimeoutRef.current = null

		const action = isHovered ? () => addNodeToHover(nodeId) : () => removeNodeFromHover(nodeId)

		if (delay === 0) {
			action()
		} else {
			hoverTimeoutRef.current = setTimeout(action, delay)
		}
	})

	const cancelPendingHover = useEvent(() => {
		clearTimeout(hoverTimeoutRef.current ?? undefined)
	})

	const onDragStart = useEvent((isLeader: boolean) => {
		if (isLeader) {
			isHoverSuppressedRef.current = true
		}
		isDraggingRef.current = true
		setHovered(false, 0)
	})

	const onDragEnd = useEvent(() => {
		isDraggingRef.current = false
	})

	const handleMouseEnter = useEvent((event: React.MouseEvent) => {
		if (isDraggingRef.current || isHoverSuppressedRef.current || event.buttons !== 0) {
			return
		}
		setHovered(true, 600)
	})

	const handleMouseLeave = useEvent(() => {
		if (isDraggingRef.current) {
			return
		}
		isHoverSuppressedRef.current = false
		setHovered(false, 0)
	})

	useEffect(
		() => () => {
			clearTimeout(hoverTimeoutRef.current ?? undefined)
			removeNodeFromHover(nodeId)
		},
		[nodeId, removeNodeFromHover],
	)

	return { handleMouseEnter, handleMouseLeave, cancelPendingHover, onDragStart, onDragEnd }
}
