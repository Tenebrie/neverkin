import { useCallback, useRef } from 'react'

export function usePointerCapture() {
	const elementRef = useRef<HTMLDivElement | null>(null)
	const capturedPointer = useRef<number | null>(null)

	const release = useCallback(() => {
		if (!elementRef.current || capturedPointer.current === null) {
			return
		}
		elementRef.current.releasePointerCapture(capturedPointer.current)
		elementRef.current.style.display = 'none'
		capturedPointer.current = null
	}, [])

	const capture = useCallback((cursor: string, pointerId: number) => {
		if (capturedPointer.current !== null) {
			return
		}
		if (!elementRef.current) {
			const element = window.document.createElement('div')
			element.style.position = 'fixed'
			elementRef.current = element
			window.document.body.appendChild(elementRef.current)
		}
		elementRef.current.style.display = 'block'
		capturedPointer.current = pointerId
		elementRef.current.style.cursor = cursor

		elementRef.current.setPointerCapture(pointerId)
	}, [])

	return { capture, release }
}
