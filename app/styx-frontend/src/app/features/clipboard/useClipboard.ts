import { RefObject, useEffect } from 'react'
import useEvent from 'react-use-event-hook'

type Props = {
	containerRef: RefObject<HTMLElement | null>
	onCopy?: (event: ClipboardEvent) => void
	onPaste?: (event: ClipboardEvent) => void
	onCut?: (event: ClipboardEvent, copy: (event: ClipboardEvent) => unknown) => void
}

export function useClipboard({ containerRef, onCopy, onPaste, onCut }: Props) {
	const shouldHandleEvent = (event: ClipboardEvent) =>
		containerRef.current?.contains(document.activeElement) && !isTargetingInput(event.target)

	const handleCopy = useEvent((event: ClipboardEvent) => {
		if (onCopy && shouldHandleEvent(event)) {
			onCopy(event)
		}
	})

	const handlePaste = useEvent((event: ClipboardEvent) => {
		if (onPaste && shouldHandleEvent(event)) {
			onPaste(event)
		}
	})

	const handleCut = useEvent((event: ClipboardEvent) => {
		if (onCut && shouldHandleEvent(event)) {
			onCut(event, handleCopy)
		}
	})

	useEffect(() => {
		const element = containerRef.current
		if (!element) {
			return
		}

		const grabFocus = () => {
			element.focus({ preventScroll: true })
		}

		document.body.addEventListener('copy', handleCopy)
		document.body.addEventListener('paste', handlePaste)
		document.body.addEventListener('cut', handleCut)
		element.addEventListener('pointerdown', grabFocus)

		return () => {
			document.body.removeEventListener('copy', handleCopy)
			document.body.removeEventListener('paste', handlePaste)
			document.body.removeEventListener('cut', handleCut)
			element.removeEventListener('pointerdown', grabFocus)
		}
	}, [containerRef, handleCopy, handleCut, handlePaste, onCopy, onCut, onPaste])
}

function isTargetingInput(target: EventTarget | null) {
	return (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		(target instanceof HTMLElement && target.isContentEditable)
	)
}
