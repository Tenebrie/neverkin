import { RefObject, useLayoutEffect } from 'react'

import { DragDropState } from '@/app/features/dragDrop/DragDropState'
import { dispatchGlobalEvent, useEventBusContext } from '@/app/features/eventBus'
import { EventParams } from '@/app/features/eventBus/types'

import { usePointerCapture } from '../../../../../../hooks/usePointerCapture'
import { useCurrentWorldId } from '../../../../hooks/useCurrentWorldId'
import { useMindmapContext } from '../../context/useMindmapContext'
import { useMindmapEdgeScroll } from '../../hooks/useMindmapEdgeScroll'
import { makeMindmapNavigationState } from '../../MindmapState'
import { MindmapState } from '../../MindmapState'
import { requestWirePaint } from '../../unrefactored/mindmapWireUtils'
import { useMindmapCameraPersistence } from './useMindmapCameraPersistence'

export const MIN_SCALE = 0.125 / 6
export const MAX_SCALE = 5

// Safari reports trackpad pinches via proprietary gesture events instead of ctrl+wheel
interface SafariGestureEvent extends Event {
	readonly scale: number
	readonly clientX: number
	readonly clientY: number
}

function isGestureEvent(event: Event): event is SafariGestureEvent {
	return 'scale' in event && 'clientX' in event
}

type Props = {
	ref: RefObject<HTMLDivElement | null>
}

// TODO: Split this up
export function useMindmapNavigation({ ref }: Props) {
	const { registerUpdateFunction, clearUpdateFunction, updateMousePosition } = useMindmapEdgeScroll()
	const bus = useEventBusContext()

	const { capture, release } = usePointerCapture()

	const worldId = useCurrentWorldId()
	const [state, setState] = useMindmapCameraPersistence()

	const { paint, workspaceRect } = useMindmapContext()

	useLayoutEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}
		const navState = makeMindmapNavigationState()

		navState.gridScale = clampScale(state.current.scale)

		const touchState = {
			mode: 'none' as 'none' | 'pan' | 'pinch',
			lastX: 0,
			lastY: 0,
			lastDistance: 0,
		}

		const saveCurrentState = () => {
			setState(() => ({
				worldId,
				center: {
					x: (navState.targetScrollLeft + workspaceRect.width / 2.0) / navState.gridScale,
					y: (navState.targetScrollTop + workspaceRect.height / 2.0) / navState.gridScale,
				},
				scale: navState.gridScale,
			}))
		}

		const paintCamera = () => {
			MindmapState.scale = navState.gridScale
			MindmapState.cameraX = navState.targetScrollLeft
			MindmapState.cameraY = navState.targetScrollTop
			requestWirePaint()
			saveCurrentState()

			paint(navState)
		}

		const panBy = (deltaX: number, deltaY: number) => {
			navState.targetScrollLeft -= deltaX
			navState.targetScrollTop -= deltaY
			paintCamera()
		}

		const zoomAt = (originX: number, originY: number, newScaleRaw: number) => {
			const newScale = clampScale(newScaleRaw)
			const scaleFactor = newScale / navState.gridScale
			navState.targetScrollLeft = (navState.targetScrollLeft + originX) * scaleFactor - originX
			navState.targetScrollTop = (navState.targetScrollTop + originY) * scaleFactor - originY
			navState.gridScale = newScale
			paintCamera()
			dispatchGlobalEvent['mindmap/scale/changed']({ scale: newScale })
		}

		const lookAt = ({ x, y, scale }: EventParams['mindmap/camera/requestLookAt']) => {
			navState.gridScale = clampScale(scale ?? navState.gridScale)
			navState.targetScrollLeft = x * navState.gridScale - workspaceRect.width / 2
			navState.targetScrollTop = y * navState.gridScale - workspaceRect.height / 2
			dispatchGlobalEvent['mindmap/scale/changed']({ scale: navState.gridScale })
			paintCamera()
		}

		lookAt({ ...state.current.center, scale: state.current.scale })

		registerUpdateFunction((scroll) => {
			panBy(scroll.x, scroll.y)
		})

		const handleMouseDown = (event: MouseEvent) => {
			if (event.button === 0) {
				if (!navState.isDragging) {
					navState.canClick = true
					navState.totalOffsetFromStart = 0
					navState.offsetFromStartX = 0
					navState.offsetFromStartY = 0
				}
				navState.isDragging = true
				navState.dragMode = 'select'
			} else if (event.button === 2) {
				if (!navState.isDragging) {
					navState.canClick = true
					navState.totalOffsetFromStart = 0
					navState.offsetFromStartX = 0
					navState.offsetFromStartY = 0
				}
				navState.isDragging = true
				navState.dragMode = 'pan'
			}
		}

		const handleClick = (event: MouseEvent) => {
			const target = event.target as HTMLElement
			if (event.button === 2 && target.hasAttribute('data-mindmap-click-area') && navState.canClick) {
				dispatchGlobalEvent['quickSelect/requestOpen']({
					query: '',
					screenPosTop: event.clientY,
					screenPosBottom: event.clientY,
					screenPosLeft: event.clientX,
				})
			}
		}

		const handleMouseUp = (event: PointerEvent) => {
			if (navState.totalOffsetFromStart < 3 && navState.canClick) {
				handleClick(event)
			}
			navState.canClick = false
			if (!navState.isDragging) {
				return
			}
			if (event.button === 0 && navState.dragMode === 'select') {
				navState.isDragging = false
			}
			if (event.button === 2 && navState.dragMode === 'pan') {
				navState.isDragging = false
				release()
			}
		}

		const handleMouseMove = (event: PointerEvent) => {
			if (DragDropState.current?.type === 'actorNodeLinking') {
				updateMousePosition(event, workspaceRect)
			}
			if (!navState.isDragging) {
				return
			}

			navState.totalOffsetFromStart += Math.abs(event.movementX) + Math.abs(event.movementY)
			navState.offsetFromStartX += event.movementX
			navState.offsetFromStartY += event.movementY
			if (navState.dragMode === 'pan') {
				panBy(event.movementX, event.movementY)
				if (navState.totalOffsetFromStart >= 4) {
					navState.canClick = false
					capture('grabbing', event.pointerId)
				}
			}
		}

		const handleWheel = (event: WheelEvent) => {
			const originX = event.clientX - workspaceRect.left
			const originY = event.clientY - workspaceRect.top

			// Trackpad pinch arrives as ctrl+wheel with fine-grained deltas
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault()
				zoomAt(originX, originY, navState.gridScale * Math.exp(-event.deltaY / 100))
				return
			}

			const looksLikeTrackpad =
				event.deltaMode === WheelEvent.DOM_DELTA_PIXEL &&
				(event.deltaX !== 0 || !Number.isInteger(event.deltaY) || Math.abs(event.deltaY) < 40)
			// Trackpad panning is left to the browser, which scrolls the canvas on the compositor
			if (looksLikeTrackpad || event.timeStamp - navState.lastTrackpadPanAt < 300) {
				navState.lastTrackpadPanAt = event.timeStamp
				panBy(-event.deltaX, -event.deltaY)
				event.preventDefault()
				return
			}

			event.preventDefault()
			zoomAt(originX, originY, navState.gridScale * Math.exp(-event.deltaY / 50))
		}

		const getTouchMidpoint = (touches: TouchList) => {
			const [a, b] = [touches[0], touches[1]]
			return {
				x: (a.clientX + b.clientX) / 2 - workspaceRect.left,
				y: (a.clientY + b.clientY) / 2 - workspaceRect.top,
				distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
			}
		}

		const handleTouchStart = (event: TouchEvent) => {
			if (event.touches.length >= 2) {
				const { x, y, distance } = getTouchMidpoint(event.touches)
				touchState.mode = 'pinch'
				touchState.lastX = x
				touchState.lastY = y
				touchState.lastDistance = distance
				event.preventDefault()
				return
			}

			// A single finger on a node is left for the node itself to handle
			const target = event.target
			if (target instanceof HTMLElement && target.closest('[data-mindmap-node]')) {
				touchState.mode = 'none'
				return
			}

			touchState.mode = 'pan'
			touchState.lastX = event.touches[0].clientX
			touchState.lastY = event.touches[0].clientY
		}

		const handleTouchMove = (event: TouchEvent) => {
			if (touchState.mode === 'pinch' && event.touches.length >= 2) {
				event.preventDefault()
				const { x, y, distance } = getTouchMidpoint(event.touches)
				if (touchState.lastDistance > 0) {
					zoomAt(x, y, navState.gridScale * (distance / touchState.lastDistance))
				}
				panBy(x - touchState.lastX, y - touchState.lastY)
				touchState.lastX = x
				touchState.lastY = y
				touchState.lastDistance = distance
				return
			}

			if (touchState.mode === 'pan' && event.touches.length === 1) {
				event.preventDefault()
				const touch = event.touches[0]
				panBy(touch.clientX - touchState.lastX, touch.clientY - touchState.lastY)
				touchState.lastX = touch.clientX
				touchState.lastY = touch.clientY
			}
		}

		const handleTouchEnd = (event: TouchEvent) => {
			if (event.touches.length >= 2) {
				return
			}
			if (event.touches.length === 1) {
				touchState.mode = 'pan'
				touchState.lastX = event.touches[0].clientX
				touchState.lastY = event.touches[0].clientY
				touchState.lastDistance = 0
				return
			}
			touchState.mode = 'none'
		}

		const handleGestureStart = (event: Event) => {
			if (touchState.mode !== 'none') {
				return
			}
			event.preventDefault()
			navState.pinchStartScale = navState.gridScale
		}

		const handleGestureChange = (event: Event) => {
			if (touchState.mode !== 'none' || !isGestureEvent(event)) {
				return
			}
			event.preventDefault()
			zoomAt(
				event.clientX - workspaceRect.left,
				event.clientY - workspaceRect.top,
				navState.pinchStartScale * event.scale,
			)
		}

		const handleContextMenu = (event: MouseEvent) => {
			event.preventDefault()
		}

		element.addEventListener('pointerdown', handleMouseDown)
		element.addEventListener('wheel', handleWheel, { passive: false })
		element.addEventListener('touchstart', handleTouchStart, { passive: false })
		element.addEventListener('touchmove', handleTouchMove, { passive: false })
		element.addEventListener('touchend', handleTouchEnd)
		element.addEventListener('touchcancel', handleTouchEnd)
		element.addEventListener('gesturestart', handleGestureStart)
		element.addEventListener('gesturechange', handleGestureChange)
		element.addEventListener('contextmenu', handleContextMenu)
		window.addEventListener('pointermove', handleMouseMove)
		window.addEventListener('pointerup', handleMouseUp)
		const offLookAt = bus.on('mindmap/camera/requestLookAt', lookAt)

		return () => {
			offLookAt()
			clearUpdateFunction()
			element.removeEventListener('pointerdown', handleMouseDown)
			element.removeEventListener('wheel', handleWheel)
			element.removeEventListener('touchstart', handleTouchStart)
			element.removeEventListener('touchmove', handleTouchMove)
			element.removeEventListener('touchend', handleTouchEnd)
			element.removeEventListener('touchcancel', handleTouchEnd)
			element.removeEventListener('gesturestart', handleGestureStart)
			element.removeEventListener('gesturechange', handleGestureChange)
			element.removeEventListener('contextmenu', handleContextMenu)
			window.removeEventListener('pointermove', handleMouseMove)
			window.removeEventListener('pointerup', handleMouseUp)
		}
	}, [
		ref,
		registerUpdateFunction,
		setState,
		clearUpdateFunction,
		updateMousePosition,
		state,
		worldId,
		bus,
		capture,
		release,
		paint,
		workspaceRect,
	])
}

function clampScale(scale: number) {
	return Math.min(Math.max(MIN_SCALE, scale), MAX_SCALE)
}
