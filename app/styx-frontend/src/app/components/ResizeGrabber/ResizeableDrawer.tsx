import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { ReactNode, useCallback, useEffect } from 'react'

import { ResizeGrabber, useResizeGrabber } from '@/app/components/ResizeGrabber/ResizeGrabber'
import { ResizeGrabberOverlay } from '@/app/components/ResizeGrabber/ResizeGrabberOverlay'
import { ResizeGrabberPreferencesSchema } from '@/app/components/ResizeGrabber/ResizeGrabberPreferencesSchema'
import usePersistentState from '@/app/hooks/usePersistentState'
import { useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { Shortcut } from '@/app/hooks/useShortcut/useShortcutManager'

import { ResizeableDrawerProvider } from './ResizeableDrawerContext'
import { ResizeableDrawerPulldown } from './ResizeableDrawerPulldown'

type Props = {
	children: ReactNode
	pulldownWidth: number
	pulldownLabel: ReactNode
	minHeight: number
	maxHeight: number
	keepMounted?: boolean
	persistentStateKey: string
	defaultOpen?: boolean
	eventHandler?: ReactNode
	hotkey?: () => (typeof Shortcut)[keyof typeof Shortcut]
	onResize?: (height: number, visible: boolean) => void
}

export function ResizeableDrawer({
	children,
	pulldownWidth,
	pulldownLabel,
	minHeight,
	maxHeight,
	keepMounted,
	persistentStateKey,
	defaultOpen,
	eventHandler,
	hotkey,
	onResize,
}: Props) {
	const [preferences, setPreferences] = usePersistentState(
		persistentStateKey,
		ResizeGrabberPreferencesSchema,
		{
			height: 400,
			visible: defaultOpen ?? false,
		},
	)

	const grabberProps = useResizeGrabber({
		minHeight,
		maxHeight,
		initialOpen: preferences.visible,
		initialHeight: preferences.height,
		keepMounted,
	})
	const {
		drawerVisible,
		contentVisible,
		height,
		preferredOpen,
		setHeight,
		setVisible,
		overflowHeight,
		isDragging,
		isDraggingChild,
	} = grabberProps

	useShortcut(
		Shortcut.Escape,
		() => {
			setVisible(false)
		},
		drawerVisible,
	)

	useEffect(() => {
		setPreferences({ height, visible: drawerVisible })
	}, [drawerVisible, height, setPreferences])

	useEffect(() => {
		onResize?.(height, drawerVisible)
	}, [height, drawerVisible, onResize])

	const onPulldownClick = useCallback(() => {
		setVisible(true)
	}, [setVisible])

	return (
		<ResizeableDrawerProvider
			height={height}
			minHeight={minHeight}
			maxHeight={maxHeight}
			drawerVisible={drawerVisible}
			preferredOpen={preferredOpen}
			setDrawerHeight={setHeight}
			setDrawerVisible={setVisible}
		>
			{eventHandler}
			<Paper
				style={{
					height,
					marginTop: drawerVisible ? `${overflowHeight}px` : `${-height}px`,
					transition: `height ${isDragging ? 0 : 0.3}s ease-in-out, margin-top ${isDragging ? 0 : 0.3}s`,
				}}
				sx={{
					position: 'relative',
					alignItems: 'center',
				}}
				elevation={2}
			>
				{contentVisible && (
					<Stack
						direction="row"
						height="100%"
						sx={{
							// TODO: Optimize
							'& > *': { flex: 1 },
							pointerEvents: 'auto',
						}}
					>
						{children}
					</Stack>
				)}
				<ResizeGrabberOverlay {...grabberProps} />
			</Paper>
			<ResizeGrabber {...grabberProps} active={drawerVisible} position="top">
				<Box
					sx={{
						opacity: drawerVisible && !isDraggingChild ? 0 : 1,
						transition: 'opacity 0.3s',
						pointerEvents: 'none',
					}}
				>
					<ResizeableDrawerPulldown
						label={pulldownLabel}
						hotkey={hotkey?.()}
						width={pulldownWidth}
						visible={!drawerVisible}
						onClick={onPulldownClick}
					/>
				</Box>
			</ResizeGrabber>
		</ResizeableDrawerProvider>
	)
}
