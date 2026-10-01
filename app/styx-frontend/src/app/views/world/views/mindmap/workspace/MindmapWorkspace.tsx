import Box from '@mui/material/Box'
import { ReactNode, useRef } from 'react'
import useEvent from 'react-use-event-hook'

import { useMindmapContext } from '../context/useMindmapContext'
import { useMindmapInitialFocus } from './navigation/useMindmapInitialFocus'
import { useMindmapNavigation } from './navigation/useMindmapNavigation'

export const WORKSPACE_SIZE = 1_000_000

type Props = {
	children: ReactNode
}

export function MindmapWorkspace({ children }: Props) {
	const ref = useRef<HTMLDivElement>(null)
	useMindmapNavigation({ ref })
	useMindmapInitialFocus()

	const { updateWorkspaceRect, onPaint } = useMindmapContext()

	const onMount = useEvent((element: HTMLDivElement) => {
		ref.current = element

		// ResizeObserver
		updateWorkspaceRect(element.getBoundingClientRect())
		const observer = new ResizeObserver(() => {
			updateWorkspaceRect(element.getBoundingClientRect())
		})
		observer.observe(element)

		// Rendering
		const offPaint = onPaint((navState) => {
			element.scrollTo({
				left: navState.targetScrollLeft + WORKSPACE_SIZE / 2.0,
				top: navState.targetScrollTop + WORKSPACE_SIZE / 2.0,
			})
		})

		return () => {
			observer.disconnect()
			offPaint()
		}
	})

	return (
		<Box
			ref={onMount}
			data-testid="MindmapGrid"
			data-mindmap-grid
			sx={{
				position: 'absolute',
				width: '100%',
				height: '100%',
				overflow: 'auto',
				overscrollBehavior: 'none',
				scrollbarWidth: 'none',
				touchAction: 'none',
				overflowAnchor: 'none',
			}}
		>
			<Box
				sx={{
					position: 'relative',
					width: WORKSPACE_SIZE,
					height: WORKSPACE_SIZE,
				}}
			>
				{children}
			</Box>
		</Box>
	)
}
