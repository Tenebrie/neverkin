import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { DragDropState } from '@/app/features/dragDrop/DragDropState'
import { getTimelinePreferences } from '@/app/features/preferences/PreferencesSliceSelectors'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { Shortcut, ShortcutPriorities, useShortcut } from '@/app/hooks/useShortcut/useShortcut'

import { ModalBackdrop, ModalContainer } from './styles'

type Props = {
	visible: boolean
	children: React.ReactNode
	onClose: (reason: 'backdropClick' | 'escapeKey') => void
	closeOnBackdropClick?: boolean
}

const Modal = ({ visible, children, onClose, closeOnBackdropClick = true }: Props) => {
	const { reduceAnimations } = useSelector(
		getTimelinePreferences,
		(a, b) => a.reduceAnimations === b.reduceAnimations,
	)
	const bodyRef = useRef<HTMLDivElement | null>(null)

	const [isModalRendered, setIsModalRendered] = useState(visible)

	useShortcut(Shortcut.Escape, () => onClose('escapeKey'), visible && ShortcutPriorities.Modal)

	const animationDuration = useMemo(() => {
		if (reduceAnimations) {
			return 0
		}
		return 0
	}, [reduceAnimations])

	// Stay mounted until the closing transition has run.
	useEffect(() => {
		if (visible) {
			setIsModalRendered(true)
			return
		}
		const timeout = window.setTimeout(() => setIsModalRendered(false), animationDuration)
		return () => window.clearTimeout(timeout)
	}, [visible, animationDuration])

	const theme = useCustomTheme()
	const isClickingRef = useRef(false)

	const onMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!closeOnBackdropClick || e.button !== 0) {
				return
			}
			isClickingRef.current = true
		},
		[closeOnBackdropClick],
	)

	const onMouseUp = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!closeOnBackdropClick || e.button !== 0 || !isClickingRef.current) {
				return
			}
			if (isClickingRef.current) {
				onClose('backdropClick')
			}
			isClickingRef.current = false
		},
		[closeOnBackdropClick, onClose],
	)

	if (!visible && !isModalRendered) {
		return null
	}

	return (
		<ModalBackdrop
			data-testid="ModalBackdrop"
			className={visible ? '' : 'closing'}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onMouseLeave={() => (isClickingRef.current = false)}
			style={{ '--modal-animation-duration': `${animationDuration}ms` } as CSSProperties}
		>
			<ModalContainer
				ref={bodyRef}
				tabIndex={-1}
				$theme={theme}
				onMouseDown={(e) => {
					e.stopPropagation()
				}}
				onMouseUp={(e) => {
					if (DragDropState.current === null) {
						e.stopPropagation()
					}
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{children}
			</ModalContainer>
		</ModalBackdrop>
	)
}

export default Modal
