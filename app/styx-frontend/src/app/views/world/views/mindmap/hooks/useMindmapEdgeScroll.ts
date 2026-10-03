import { useCallback, useEffect, useRef } from 'react'

export function useMindmapEdgeScroll() {
	const updateFunction = useRef<(scroll: { x: number; y: number }) => void>(undefined)
	const lastSeenMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const lastSeenElementRect = useRef<DOMRect | null>(null)

	const registerUpdateFunction = useCallback((callback: (scroll: { x: number; y: number }) => void) => {
		updateFunction.current = callback
	}, [])

	const clearUpdateFunction = useCallback(() => {
		updateFunction.current = undefined
	}, [])

	const updateLoopRunning = useRef(false)
	const lastUpdateLoopUpdate = useRef(-1)
	const runUpdateLoop = useRef(() => {
		requestAnimationFrame((time) => {
			if (!updateLoopRunning.current) {
				lastUpdateLoopUpdate.current = -1
				return
			}

			if (lastUpdateLoopUpdate.current < 0) {
				lastUpdateLoopUpdate.current = time
				runUpdateLoop.current()
				return
			}
			const deltaTime = (time - lastUpdateLoopUpdate.current) / 1000
			lastUpdateLoopUpdate.current = time

			if (!lastSeenElementRect.current || !updateFunction.current) {
				updateLoopRunning.current = false
				lastUpdateLoopUpdate.current = -1
				return
			}

			const movementVector = { x: 0, y: 0 }
			const threshold = 150
			const speedMultiplier = 5

			const distToLeft = lastSeenMousePosition.current.x - lastSeenElementRect.current.left
			const distToRight = lastSeenElementRect.current.right - lastSeenMousePosition.current.x
			const distToTop = lastSeenMousePosition.current.y - lastSeenElementRect.current.top
			const distToBottom = lastSeenElementRect.current.bottom - lastSeenMousePosition.current.y

			if (distToLeft <= threshold) {
				movementVector.x = threshold - distToLeft
			} else if (distToRight <= threshold) {
				movementVector.x = distToRight - threshold
			}

			if (distToTop <= threshold) {
				movementVector.y = threshold - distToTop
			} else if (distToBottom <= threshold) {
				movementVector.y = distToBottom - threshold
			}

			if (movementVector.x === 0 && movementVector.y === 0) {
				updateLoopRunning.current = false
				lastUpdateLoopUpdate.current = -1
				return
			}

			updateFunction.current({
				x: movementVector.x * speedMultiplier * deltaTime,
				y: movementVector.y * speedMultiplier * deltaTime,
			})
			runUpdateLoop.current()
		})
	})

	const updateMousePosition = useCallback((event: MouseEvent, element: DOMRect) => {
		if (event.buttons === 0) {
			updateLoopRunning.current = false
			return
		}

		lastSeenMousePosition.current = { x: event.clientX, y: event.clientY }
		lastSeenElementRect.current = element
		if (!updateLoopRunning.current) {
			updateLoopRunning.current = true
			runUpdateLoop.current()
		}
	}, [])

	useEffect(() => {
		const onMouseUp = () => {
			updateLoopRunning.current = false
		}

		window.addEventListener('mouseup', onMouseUp)
		return () => {
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [])

	return {
		registerUpdateFunction,
		clearUpdateFunction,
		updateMousePosition,
	}
}
