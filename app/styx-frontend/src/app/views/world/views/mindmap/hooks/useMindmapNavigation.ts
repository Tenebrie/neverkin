import { RefObject, useLayoutEffect } from 'react'
import z from 'zod'

import { DragDropState } from '@/app/features/dragDrop/DragDropState'
import { dispatchGlobalEvent, useEventBusContext } from '@/app/features/eventBus'
import { EventParams } from '@/app/features/eventBus/types'
import usePersistentStateRef from '@/app/hooks/usePersistentStateRef'
import { useStrictParams } from '@/router-utils/hooks/useStrictParams'

import { CANVAS_ORIGIN } from '../utils/mindmapCanvas'
import { useMindmapEdgeScroll } from './useMindmapEdgeScroll'
import { useMindmapInitialFocus } from './useMindmapInitialFocus'

const MIN_SCALE = 0.125
const MAX_SCALE = 5
// Time constant of the zoom easing, in seconds. Scale and scroll are eased by the same loop so they cannot drift apart.
const ZOOM_SMOOTHING = 0.035

// Safari reports trackpad pinches via proprietary gesture events instead of ctrl+wheel
interface SafariGestureEvent extends Event {
	readonly scale: number
	readonly clientX: number
	readonly clientY: number
}

function isGestureEvent(event: Event): event is SafariGestureEvent {
	return 'scale' in event && 'clientX' in event
}

export function useMindmapNavigation(ref: RefObject<HTMLDivElement | null>) {
	const { registerUpdateFunction, clearUpdateFunction, updateMousePosition } = useMindmapEdgeScroll()
	const bus = useEventBusContext()

	const { worldId } = useStrictParams({ from: '/world/$worldId/_world' })
	const defaultCamera = { worldId: '', center: { x: 0, y: 0 }, scale: 1 }
	const [state, setState] = usePersistentStateRef(
		'mindmapCamera',
		z
			.object({
				worldId: z.string(),
				center: z.object({
					x: z.number(),
					y: z.number(),
				}),
				scale: z.number().min(0),
			})
			.transform((camera) => (camera.worldId === worldId ? camera : defaultCamera)),
		defaultCamera,
		sessionStorage,
	)

	useLayoutEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}

		const navState = {
			canClick: false,
			totalOffsetFromStart: 0,
			isDragging: false,
			dragMode: 'select' as 'select' | 'pan',
			gridScale: clampScale(state.current.scale),
			renderedScale: clampScale(state.current.scale),
			targetScrollLeft: 0,
			targetScrollTop: 0,
			frame: null as number | null,
			lastFrameTime: 0,
			elementRect: element.getBoundingClientRect(),
			lastTrackpadPanAt: -Infinity,
			pinchStartScale: 1,
		}

		const touchState = {
			mode: 'none' as 'none' | 'pan' | 'pinch',
			lastX: 0,
			lastY: 0,
			lastDistance: 0,
		}

		const persist = () => {
			setState(() => ({
				worldId,
				center: {
					x: (element.scrollLeft + navState.elementRect.width / 2) / navState.renderedScale - CANVAS_ORIGIN,
					y: (element.scrollTop + navState.elementRect.height / 2) / navState.renderedScale - CANVAS_ORIGIN,
				},
				scale: navState.gridScale,
			}))
		}

		const writeCamera = (scale: number, scrollLeft: number, scrollTop: number) => {
			navState.renderedScale = scale
			element.style.setProperty('--grid-scale', scale.toString())
			element.scrollLeft = scrollLeft
			element.scrollTop = scrollTop

			if (Math.abs(element.scrollLeft - scrollLeft) > 0.5) {
				navState.targetScrollLeft = element.scrollLeft
			}
			if (Math.abs(element.scrollTop - scrollTop) > 0.5) {
				navState.targetScrollTop = element.scrollTop
			}
		}

		const stopEasing = () => {
			if (navState.frame !== null) {
				cancelAnimationFrame(navState.frame)
				navState.frame = null
			}
		}

		const settleCamera = () => {
			stopEasing()
			writeCamera(navState.gridScale, navState.targetScrollLeft, navState.targetScrollTop)
			persist()
		}

		const easeCamera = () => {
			if (navState.frame !== null) {
				return
			}

			navState.lastFrameTime = performance.now()
			const step = (time: number) => {
				const deltaTime = (time - navState.lastFrameTime) / 1000
				navState.lastFrameTime = time

				const scaleDelta = navState.gridScale - navState.renderedScale
				const leftDelta = navState.targetScrollLeft - element.scrollLeft
				const topDelta = navState.targetScrollTop - element.scrollTop
				if (Math.abs(scaleDelta) < 0.0005 && Math.abs(leftDelta) < 0.5 && Math.abs(topDelta) < 0.5) {
					navState.frame = null
					settleCamera()
					return
				}

				const factor = Math.min(1, 1 - Math.exp(-deltaTime / ZOOM_SMOOTHING))
				writeCamera(
					navState.renderedScale + scaleDelta * factor,
					element.scrollLeft + leftDelta * factor,
					element.scrollTop + topDelta * factor,
				)
				navState.frame = requestAnimationFrame(step)
			}
			navState.frame = requestAnimationFrame(step)
		}

		// Native scrolling owns the scroll offset, so targets are only meaningful while the camera drives it
		const syncTargetsFromScroll = () => {
			if (navState.frame !== null) {
				return
			}
			navState.targetScrollLeft = element.scrollLeft
			navState.targetScrollTop = element.scrollTop
		}

		const panBy = (deltaX: number, deltaY: number) => {
			syncTargetsFromScroll()
			navState.targetScrollLeft -= deltaX
			navState.targetScrollTop -= deltaY
			settleCamera()
		}

		const zoomAt = (originX: number, originY: number, newScaleRaw: number) => {
			syncTargetsFromScroll()
			const newScale = clampScale(newScaleRaw)
			const scaleFactor = newScale / navState.gridScale
			navState.targetScrollLeft = (navState.targetScrollLeft + originX) * scaleFactor - originX
			navState.targetScrollTop = (navState.targetScrollTop + originY) * scaleFactor - originY
			navState.gridScale = newScale
		}

		const lookAt = ({ x, y, scale }: EventParams['mindmap/camera/requestLookAt']) => {
			navState.gridScale = clampScale(scale ?? navState.gridScale)
			navState.targetScrollLeft = (x + CANVAS_ORIGIN) * navState.gridScale - navState.elementRect.width / 2
			navState.targetScrollTop = (y + CANVAS_ORIGIN) * navState.gridScale - navState.elementRect.height / 2
			settleCamera()
		}

		lookAt({ ...state.current.center, scale: navState.gridScale })

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === element) {
					navState.elementRect = element.getBoundingClientRect()
					persist()
				}
			}
		})
		resizeObserver.observe(element)

		registerUpdateFunction((scroll) => {
			panBy(scroll.x, scroll.y)
		})

		const handleMouseDown = (event: MouseEvent) => {
			if (event.button === 0) {
				if (!navState.isDragging) {
					navState.canClick = true
					navState.totalOffsetFromStart = 0
				}
				navState.isDragging = true
				navState.dragMode = 'select'
			} else if (event.button === 2) {
				if (!navState.isDragging) {
					navState.canClick = true
					navState.totalOffsetFromStart = 0
				}
				navState.isDragging = true
				navState.dragMode = 'pan'
			}
		}

		const handleClick = (event: MouseEvent) => {
			const target = event.target as HTMLElement
			if (event.button === 2 && target.hasAttribute('data-mindmap-click-area')) {
				dispatchGlobalEvent['quickSelect/requestOpen']({
					query: '',
					screenPosTop: event.clientY,
					screenPosBottom: event.clientY,
					screenPosLeft: event.clientX,
				})
			}
		}

		const handleMouseUp = (event: MouseEvent) => {
			if (navState.totalOffsetFromStart < 5 && navState.canClick) {
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
			}
		}

		const handleMouseMove = (event: MouseEvent) => {
			if (DragDropState.current?.type === 'actorNodeLinking') {
				updateMousePosition(event, navState.elementRect)
			}
			if (!navState.isDragging) {
				return
			}

			navState.totalOffsetFromStart += Math.abs(event.movementX) + Math.abs(event.movementY)
			if (navState.dragMode === 'pan') {
				panBy(event.movementX, event.movementY)
			}
		}

		const handleWheel = (event: WheelEvent) => {
			const originX = event.clientX - navState.elementRect.left
			const originY = event.clientY - navState.elementRect.top

			// Trackpad pinch arrives as ctrl+wheel with fine-grained deltas
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault()
				zoomAt(originX, originY, navState.gridScale * Math.exp(-event.deltaY / 100))
				easeCamera()
				return
			}

			const looksLikeTrackpad =
				event.deltaMode === WheelEvent.DOM_DELTA_PIXEL &&
				(event.deltaX !== 0 || !Number.isInteger(event.deltaY) || Math.abs(event.deltaY) < 40)
			// Trackpad panning is left to the browser, which scrolls the canvas on the compositor
			if (looksLikeTrackpad || event.timeStamp - navState.lastTrackpadPanAt < 300) {
				navState.lastTrackpadPanAt = event.timeStamp
				stopEasing()
				return
			}

			event.preventDefault()
			zoomAt(originX, originY, navState.gridScale * Math.exp(-event.deltaY / 50))
			easeCamera()
		}

		const getTouchMidpoint = (touches: TouchList) => {
			const [a, b] = [touches[0], touches[1]]
			return {
				x: (a.clientX + b.clientX) / 2 - navState.elementRect.left,
				y: (a.clientY + b.clientY) / 2 - navState.elementRect.top,
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
				event.clientX - navState.elementRect.left,
				event.clientY - navState.elementRect.top,
				navState.pinchStartScale * event.scale,
			)
			easeCamera()
		}

		const handleContextMenu = (event: MouseEvent) => {
			event.preventDefault()
		}

		element.addEventListener('mousedown', handleMouseDown)
		element.addEventListener('scroll', persist, { passive: true })
		element.addEventListener('wheel', handleWheel, { passive: false })
		element.addEventListener('touchstart', handleTouchStart, { passive: false })
		element.addEventListener('touchmove', handleTouchMove, { passive: false })
		element.addEventListener('touchend', handleTouchEnd)
		element.addEventListener('touchcancel', handleTouchEnd)
		element.addEventListener('gesturestart', handleGestureStart)
		element.addEventListener('gesturechange', handleGestureChange)
		element.addEventListener('contextmenu', handleContextMenu)
		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)
		const offLookAt = bus.on('mindmap/camera/requestLookAt', lookAt)

		return () => {
			offLookAt()
			stopEasing()
			clearUpdateFunction()
			resizeObserver.disconnect()
			element.removeEventListener('mousedown', handleMouseDown)
			element.removeEventListener('scroll', persist)
			element.removeEventListener('wheel', handleWheel)
			element.removeEventListener('touchstart', handleTouchStart)
			element.removeEventListener('touchmove', handleTouchMove)
			element.removeEventListener('touchend', handleTouchEnd)
			element.removeEventListener('touchcancel', handleTouchEnd)
			element.removeEventListener('gesturestart', handleGestureStart)
			element.removeEventListener('gesturechange', handleGestureChange)
			element.removeEventListener('contextmenu', handleContextMenu)
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [ref, registerUpdateFunction, setState, clearUpdateFunction, updateMousePosition, state, worldId, bus])

	useMindmapInitialFocus(ref, !state.current.worldId)
}

function clampScale(scale: number) {
	return Math.min(Math.max(MIN_SCALE, scale), MAX_SCALE)
}
