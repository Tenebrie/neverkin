import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import useEvent from 'react-use-event-hook'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useUpdateMindmapNode } from '@/app/views/world/views/mindmap/api/useUpdateMindmapNode'

type Props = {
	nodeId: string
	name: string
}

export function MindmapNodeContentStickyNoteEditor({ nodeId, name }: Props) {
	const [isEditing, setIsEditing] = useState(false)
	const [updateNode] = useUpdateMindmapNode()

	useEventBusSubscribe['mindmap/node/requestEditPlainNode']({
		callback: ({ nodeId: editNodeId }) => {
			if (nodeId === editNodeId) {
				setIsEditing(true)
			}
		},
	})

	const onMount = useEvent((element: HTMLTextAreaElement) => {
		fitToContent(element)
		element.focus()
		element.select()
		const blurOnOutsidePress = (event: PointerEvent) => {
			if (event.target !== element) {
				element.blur()
			}
		}

		function stopPropagation(event: Event) {
			event.stopPropagation()
		}

		element.addEventListener('pointerdown', stopPropagation)
		element.addEventListener('mousedown', stopPropagation)
		window.addEventListener('pointerdown', blurOnOutsidePress, true)
		return () => {
			element.removeEventListener('pointerdown', stopPropagation)
			element.removeEventListener('mousedown', stopPropagation)
			window.removeEventListener('pointerdown', blurOnOutsidePress, true)
		}
	})

	if (!isEditing || !nodeId) {
		return (
			<Typography
				sx={{
					textAlign: 'center',
					overflowWrap: 'anywhere',
					whiteSpace: 'pre-wrap',
					display: '-webkit-box',
					WebkitLineClamp: 8,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
				}}
			>
				{name || <i>empty</i>}
			</Typography>
		)
	}

	return (
		<Box
			data-1p-ignore
			component="textarea"
			ref={onMount}
			defaultValue={name}
			rows={1}
			onInput={(event) => fitToContent(event.currentTarget)}
			onClick={(event) => event.stopPropagation()}
			onKeyDown={(event) => {
				if (event.key === 'Escape') {
					event.currentTarget.value = name
					event.currentTarget.blur()
				} else if (event.key === 'Enter' && !event.shiftKey) {
					event.currentTarget.blur()
				}
			}}
			onBlur={(event) => {
				setIsEditing(false)
				if (event.currentTarget.value !== name) {
					updateNode(nodeId, { name: event.currentTarget.value })
				}
			}}
			sx={{
				display: 'block',
				width: '100%',
				margin: 0,
				padding: 0,
				border: 'none',
				outline: 'none',
				resize: 'none',
				overflow: 'hidden',
				background: 'transparent',
				color: 'inherit',
				typography: 'body1',
				textAlign: 'center',
				overflowWrap: 'anywhere',
				userSelect: 'text',
			}}
		/>
	)
}

function fitToContent(element: HTMLTextAreaElement) {
	element.style.height = 'auto'
	element.style.height = `${element.scrollHeight}px`
}
