import { RefObject, useEffect } from 'react'
import useEvent from 'react-use-event-hook'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { DragTrigger, matchesDragTrigger } from '@/app/features/dragDrop/DragTrigger'
import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useAutoRef } from '@/app/hooks/useAutoRef'
import { usePointerCapture } from '@/app/hooks/usePointerCapture'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import {
	useMindmapContext,
	useMindmapSelectionContext,
} from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'

import { getNodeLayout } from '../../wires/utils/getNodeLayout'

type Props = {
	node: MindmapNode
	ref: RefObject<HTMLDivElement | null>
	moveTo: (x: number, y: number) => void
	selectedRef: RefObject<boolean>
	onDragStart: (isLeader: boolean) => void
	onDragEnd: () => void
}

export function useMindmapNodeDrag({ node, ref, moveTo, selectedRef, onDragStart, onDragEnd }: Props) {
	const { moveNodes, nodeLayouts } = useMindmapContext()
	const { selectedNodes, clearSelections } = useMindmapSelectionContext()
	const nodeRef = useAutoRef(node)
	const getPosition = useEvent(() => getNodeLayout(nodeLayouts, nodeRef.current))
	const { capture: capturePointer, release: releasePointer } = usePointerCapture()

	const startDragging = useEvent((isLeader: boolean) => {
		ref.current?.setAttribute('data-dragging', 'true')
		onDragStart(isLeader)
	})

	const stopDragging = useEvent(() => {
		ref.current?.setAttribute('data-dragging', 'false')
		onDragEnd()
	})

	useEventBusSubscribe['mindmap/node/onGroupDragStart']({
		callback: ({ sourceNodeId }) => {
			if (sourceNodeId === node.id || !selectedRef.current) {
				return
			}
			startDragging(false)
		},
	})
	useEventBusSubscribe['mindmap/node/onGroupDragUpdate']({
		callback: ({ sourceNodeId, deltaX, deltaY }) => {
			if (sourceNodeId === node.id || !selectedRef.current) {
				return
			}
			const { x, y } = getPosition()
			moveTo(x + deltaX, y + deltaY)
		},
	})
	useEventBusSubscribe['mindmap/node/onGroupDragEnd']({
		callback: ({ sourceNodeId }) => {
			if (sourceNodeId === node.id || !selectedRef.current) {
				return
			}
			stopDragging()
		},
	})

	useEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}

		const mouseState = {
			isButtonDown: false,
			startClientX: 0,
			startClientY: 0,
			startPositionX: 0,
			startPositionY: 0,
			positionX: 0,
			positionY: 0,
			gridScale: 1,

			isDragging: false,
		}

		const handleMouseDown = (event: MouseEvent) => {
			if (event.button !== 0) {
				return
			}
			event.stopPropagation()

			const isMoveTrigger = matchesDragTrigger(event, DragTrigger.MoveElements)
			if (!isMoveTrigger) {
				return
			}

			if (!selectedRef.current && !isMultiselectEvent(event)) {
				clearSelections()
			}

			const { x, y } = getPosition()
			mouseState.startClientX = event.clientX
			mouseState.startClientY = event.clientY
			mouseState.startPositionX = x
			mouseState.startPositionY = y
			mouseState.positionX = x
			mouseState.positionY = y
			mouseState.isButtonDown = true
			mouseState.gridScale = MindmapState.scale
			window.addEventListener('pointermove', handleMouseMove)
			window.addEventListener('pointerup', handleMouseUp)
		}

		const handleMouseWheel = (event: WheelEvent) => {
			if (mouseState.isDragging) {
				event.stopPropagation()
				event.preventDefault()
			}
		}

		const handleMouseMove = (event: PointerEvent) => {
			const pointerOffsetX = event.clientX - mouseState.startClientX
			const pointerOffsetY = event.clientY - mouseState.startClientY

			if (!mouseState.isDragging && (Math.abs(pointerOffsetX) > 3 || Math.abs(pointerOffsetY) > 3)) {
				mouseState.isDragging = true
				startDragging(true)
				capturePointer('grabbing', event.pointerId)
				dispatchGlobalEvent['mindmap/node/onGroupDragStart']({
					sourceNodeId: nodeRef.current.id,
				})
			}

			if (mouseState.isDragging) {
				const nextPositionX = mouseState.startPositionX + pointerOffsetX / mouseState.gridScale
				const nextPositionY = mouseState.startPositionY + pointerOffsetY / mouseState.gridScale
				moveTo(nextPositionX, nextPositionY)
				dispatchGlobalEvent['mindmap/node/onGroupDragUpdate']({
					sourceNodeId: nodeRef.current.id,
					deltaX: nextPositionX - mouseState.positionX,
					deltaY: nextPositionY - mouseState.positionY,
				})

				mouseState.positionX = nextPositionX
				mouseState.positionY = nextPositionY
			}
		}

		const handleMouseUp = (event: PointerEvent) => {
			if (event.button !== 0 || !mouseState.isButtonDown) {
				return
			}

			mouseState.isButtonDown = false
			window.removeEventListener('pointermove', handleMouseMove)
			window.removeEventListener('pointerup', handleMouseUp)

			if (!mouseState.isDragging) {
				return
			}
			mouseState.isDragging = false

			const { x, y } = getPosition()
			const snappedX = Math.round(x)
			const snappedY = Math.round(y)
			moveTo(snappedX, snappedY)

			moveNodes({
				nodeIds: [...new Set(selectedNodes.keys()).add(nodeRef.current.id)],
				deltaX: snappedX - nodeRef.current.positionX,
				deltaY: snappedY - nodeRef.current.positionY,
			})

			dispatchGlobalEvent['mindmap/node/onGroupDragUpdate']({
				sourceNodeId: nodeRef.current.id,
				deltaX: snappedX - mouseState.positionX,
				deltaY: snappedY - mouseState.positionY,
			})
			dispatchGlobalEvent['mindmap/node/onGroupDragEnd']({
				sourceNodeId: nodeRef.current.id,
			})

			stopDragging()
			releasePointer()
		}

		element.addEventListener('pointerdown', handleMouseDown)
		element.addEventListener('wheel', handleMouseWheel)

		return () => {
			element.removeEventListener('pointerdown', handleMouseDown)
			element.removeEventListener('wheel', handleMouseWheel)
			window.removeEventListener('pointermove', handleMouseMove)
			window.removeEventListener('pointerup', handleMouseUp)
		}
	}, [
		ref,
		getPosition,
		selectedRef,
		nodeRef,
		moveNodes,
		moveTo,
		startDragging,
		stopDragging,
		capturePointer,
		releasePointer,
		clearSelections,
		selectedNodes,
	])
}
