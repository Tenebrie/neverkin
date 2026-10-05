import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import { ReactNode, useEffect } from 'react'

import { ResizeGrabber, useResizeGrabber } from '@/app/components/ResizeGrabber/ResizeGrabber'
import { ResizeGrabberOverlay } from '@/app/components/ResizeGrabber/ResizeGrabberOverlay'
import { ResizeGrabberPreferencesSchema } from '@/app/components/ResizeGrabber/ResizeGrabberPreferencesSchema'
import usePersistentState from '@/app/hooks/usePersistentState'

type Props = {
	children: ReactNode
}

export function WikiOutlinerDrawer({ children }: Props) {
	const minWidth = 250
	const maxWidth = window.innerWidth * 0.8
	const [preferences, setPreferences] = usePersistentState(
		'wikiOutlinerState/v1',
		ResizeGrabberPreferencesSchema,
		{
			height: 432,
			visible: true,
		},
	)

	const grabberProps = useResizeGrabber({
		initialOpen: preferences.visible,
		initialHeight: preferences.height,
		minHeight: minWidth,
		maxHeight: maxWidth,
	})
	const { drawerVisible, contentVisible, height, overflowHeight, isDragging } = grabberProps

	useEffect(() => {
		setPreferences({ height, visible: drawerVisible })
	}, [drawerVisible, height, setPreferences])

	return (
		<Paper
			style={{
				width: height,
				marginLeft: drawerVisible ? `${Math.max(overflowHeight, -height)}px` : `${-height}px`,
				transition: `margin-left ${isDragging ? 0 : 0.3}s`,
			}}
			sx={(theme) => ({
				position: 'relative',
				containerType: 'inline-size',
				containerName: 'outliner-drawer',
				flexShrink: 0,
				zIndex: 2,
				boxSizing: 'border-box',
				padding: 2,
				paddingTop: '24px',
				paddingBottom: 0,
				borderRadius: 0,
				borderLeft: `1px solid ${theme.palette.divider}`,
				borderRight: `1px solid ${theme.palette.divider}`,
			})}
			elevation={1}
		>
			<Box sx={{ height: 1, pointerEvents: isDragging ? 'none' : 'unset' }}>
				{contentVisible && <>{children}</>}
			</Box>
			<Box
				sx={{
					top: 0,
					right: 0,
					position: 'absolute',
					height: 1,
					zIndex: 1,
					opacity: !drawerVisible || isDragging ? 1 : 0,
					transition: 'opacity 0.3s',
					'&:hover': {
						opacity: 1,
					},
				}}
			>
				<ResizeGrabber {...grabberProps} active position={'left'} />
			</Box>
			<ResizeGrabberOverlay {...grabberProps} />
		</Paper>
	)
}
