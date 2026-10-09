import Box from '@mui/material/Box'
import { memo, useCallback, useState } from 'react'

import { MentionedEntity } from '@/api/types/worldTypes'
import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { Shortcut, ShortcutPriorities, useShortcut } from '@/app/hooks/useShortcut/useShortcut'

import { QuickSelectListContent } from './QuickSelectListContent'
import { QuickSelectRect } from './types'

type Props = {
	isFocused: boolean
	onSelect: (params: { query: string; entity: { id: string; type: MentionedEntity; name: string } }) => void
	inputProps?: InputProps
	forceDirection?: 'bottom'
	onCreatePlainNode?: (name: string) => void
}

type InputProps = {
	autoFocus?: boolean
	placeholder?: string
}

export type QuickSelectListProps = Props

export const QuickSelectList = memo(QuickSelectListComponent)

export function QuickSelectListComponent(props: Props) {
	const [visible, setVisible] = useState(false)
	const [pos, setPos] = useState<QuickSelectRect>({ top: 0, bottom: 0, left: 0 })
	const [query, setQuery] = useState('')

	const close = useCallback(() => {
		setVisible(false)
		dispatchGlobalEvent['quickSelect/onClosed']()
	}, [])

	useShortcut(
		Shortcut.Escape,
		() => {
			close()
		},
		visible && props.isFocused && ShortcutPriorities.Mentions,
	)

	useEventBusSubscribe['quickSelect/requestOpen']({
		callback: ({ query, screenPosTop, screenPosBottom, screenPosLeft }) => {
			setVisible(true)
			setQuery(query)
			setPos({ top: screenPosTop, bottom: screenPosBottom, left: screenPosLeft })
		},
	})
	useEventBusSubscribe['quickSelect/requestUpdate']({
		callback: ({ query, screenPosTop, screenPosBottom, screenPosLeft }) => {
			setQuery(query)
			setPos({ top: screenPosTop, bottom: screenPosBottom, left: screenPosLeft })
		},
	})
	useEventBusSubscribe['quickSelect/requestUpdateQuery']({
		callback: ({ query }) => {
			setQuery(query)
		},
	})
	useEventBusSubscribe['quickSelect/requestClose']({
		callback: () => {
			close()
		},
	})

	if (!visible || !props.isFocused) {
		return null
	}

	return (
		<Box
			sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100 }}
			onClick={() => {
				close()
			}}
			onContextMenu={(event) => {
				if (event.shiftKey) {
					return
				}
				event.preventDefault()
			}}
		>
			<QuickSelectListContent pos={pos} query={query} {...props} />
		</Box>
	)
}
