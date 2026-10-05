import Box from '@mui/material/Box'
import { memo, RefObject, useEffect, useRef } from 'react'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'

export type SelectionRect = {
	visible: boolean
	x: number
	y: number
	width: number
	height: number
}

export type SelectionBoxHandle = {
	scaleAround: (originX: number, originY: number, factor: number) => void
}

type Props = {
	ref: RefObject<HTMLDivElement | null>
	handle?: RefObject<SelectionBoxHandle | null>
	onClick: (event: MouseEvent) => void
	onUpdateSelection: (rect: SelectionRect, event: MouseEvent) => void
	onFinalizeSelection: (rect: SelectionRect, event: MouseEvent) => void
}

export const SelectionBox = memo(SelectionBoxComponent)

export function SelectionBoxComponent({
	ref,
	handle,
	onClick,
	onUpdateSelection,
	onFinalizeSelection,
}: Props) {
	const selectionRect = useRef<SelectionRect>({
		visible: false,
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	})
	const selectionBoxRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const element = ref.current
		const selectionBoxElement = selectionBoxRef.current
		if (!element || !selectionBoxElement) {
			return
		}

		const applySelectionBoxStyle = () => {
			const { visible, x, y, width, height } = selectionRect.current
			const actualX = width < 0 ? x + width : x
			const actualY = height < 0 ? y + height : y
			selectionBoxElement.style.left = `${actualX}px`
			selectionBoxElement.style.top = `${actualY}px`
			selectionBoxElement.style.width = `${Math.abs(width)}px`
			selectionBoxElement.style.height = `${Math.abs(height)}px`
			selectionBoxElement.style.opacity = visible ? '1' : '0'
			selectionBoxElement.style.transition = visible ? 'none' : 'opacity 0.4s'
		}

		const mouseState = {
			isButtonDown: false,
			buttonDownMode: 'select' as 'select' | 'pan',

			canClick: true,
			startX: 0,
			startY: 0,
			lastIntersectionCheckTimestamp: 0,
		}

		const followCursor = (event: MouseEvent) => {
			const containerRect = element.getBoundingClientRect()
			const cursorX = event.clientX - containerRect.left - 2
			const cursorY = event.clientY - containerRect.top - 3
			selectionRect.current.width = cursorX - selectionRect.current.x
			selectionRect.current.height = cursorY - selectionRect.current.y
		}

		const handleMouseDown = (event: MouseEvent) => {
			event.preventDefault()
			if (event.button === 0) {
				mouseState.isButtonDown = true
				mouseState.buttonDownMode = 'select'
			} else if (event.button === 2) {
				mouseState.isButtonDown = true
				mouseState.buttonDownMode = 'pan'
			} else {
				return
			}

			mouseState.startX = event.clientX
			mouseState.startY = event.clientY
			mouseState.canClick = true
		}

		const handleMouseUp = (event: MouseEvent) => {
			if ((event.button !== 0 && event.button !== 2) || !mouseState.isButtonDown) {
				return
			}
			if (mouseState.canClick) {
				onClick(event)
			}

			// Finalize selection on mouse up
			if (mouseState.buttonDownMode === 'select' && selectionRect.current.visible) {
				onFinalizeSelection(selectionRect.current, event)
			}

			selectionRect.current.visible = false
			applySelectionBoxStyle()
			mouseState.isButtonDown = false
			mouseState.canClick = true
		}

		const handleMouseMove = (event: MouseEvent) => {
			if (!mouseState.isButtonDown) {
				return
			}

			const pointerOffsetX = event.clientX - mouseState.startX
			const pointerOffsetY = event.clientY - mouseState.startY

			if (mouseState.canClick && (Math.abs(pointerOffsetX) > 3 || Math.abs(pointerOffsetY) > 3)) {
				mouseState.canClick = false
				if (mouseState.buttonDownMode === 'select') {
					const baseRect = element.getBoundingClientRect()
					selectionRect.current = {
						visible: true,
						x: mouseState.startX - baseRect.left - 1,
						y: mouseState.startY - baseRect.top - 3,
						width: 0,
						height: 0,
					}
					followCursor(event)
					applySelectionBoxStyle()
				}
			} else if (!mouseState.canClick && mouseState.buttonDownMode === 'select') {
				followCursor(event)
				applySelectionBoxStyle()

				// Throttle intersection checks
				const now = Date.now()
				if (now - mouseState.lastIntersectionCheckTimestamp >= 16) {
					mouseState.lastIntersectionCheckTimestamp = now
					onUpdateSelection(selectionRect.current, event)
				}
			}
		}

		if (handle) {
			handle.current = {
				scaleAround: (originX, originY, factor) => {
					const rect = selectionRect.current
					rect.x = originX + (rect.x - originX) * factor
					rect.y = originY + (rect.y - originY) * factor
					rect.width *= factor
					rect.height *= factor
					applySelectionBoxStyle()
				},
			}
		}

		element.addEventListener('mousedown', handleMouseDown)
		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)

		return () => {
			if (handle) {
				handle.current = null
			}
			element.removeEventListener('mousedown', handleMouseDown)
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [onClick, onUpdateSelection, onFinalizeSelection, ref, handle])

	const theme = useCustomTheme()

	return (
		<Box
			ref={selectionBoxRef}
			sx={{
				zIndex: 1000,
				backgroundColor: theme.custom.palette.background.hard,
				position: 'absolute',
				borderRadius: '2px',
				top: 0,
				left: 0,
				width: 0,
				height: 0,
				opacity: 0,
				pointerEvents: 'none',
			}}
		/>
	)
}
