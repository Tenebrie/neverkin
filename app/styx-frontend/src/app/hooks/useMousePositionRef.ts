import { RefObject, useEffect } from 'react'

const mousePosition: RefObject<{ x: number; y: number }> = { current: { x: 0, y: 0 } }
let subscriberCount = 0

export function useMousePositionRef() {
	useEffect(() => {
		subscriberCount += 1
		if (subscriberCount === 1) {
			window.addEventListener('mousemove', onMouseMove)
		}

		return () => {
			subscriberCount -= 1
			if (subscriberCount === 0) {
				window.removeEventListener('mousemove', onMouseMove)
			}
		}
	}, [])

	return mousePosition
}

function onMouseMove(event: MouseEvent) {
	mousePosition.current = { x: event.clientX, y: event.clientY }
}
