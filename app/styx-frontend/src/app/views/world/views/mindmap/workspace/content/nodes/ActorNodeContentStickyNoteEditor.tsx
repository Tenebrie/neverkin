import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useCallback, useState } from 'react'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useEventBusSubscribe } from '@/app/features/eventBus'

import { useUpdateMindmapNode } from '../../../api/useUpdateMindmapNode'

type Props = {
	node?: MindmapNode
	name: string
}

export function ActorNodeContentStickyNoteEditor({ node, name }: Props) {
	const [isEditing, setIsEditing] = useState(false)
	const [updateNode] = useUpdateMindmapNode()

	useEventBusSubscribe['mindmap/node/requestEditPlainNode']({
		callback: ({ nodeId }) => {
			if (nodeId === node?.id) {
				setIsEditing(true)
			}
		},
	})

	const attachTextarea = useCallback((element: HTMLTextAreaElement) => {
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
	}, [])

	if (!isEditing || !node) {
		return (
			<Typography
				sx={{
					textAlign: 'center',
					overflowWrap: 'anywhere',
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
			ref={attachTextarea}
			defaultValue={name}
			rows={1}
			onInput={(event) => fitToContent(event.currentTarget)}
			onClick={(event) => event.stopPropagation()}
			onKeyDown={(event) => {
				if (event.key === 'Escape') {
					event.currentTarget.value = name
					event.currentTarget.blur()
				} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
					event.currentTarget.blur()
				}
			}}
			onBlur={(event) => {
				setIsEditing(false)
				if (event.currentTarget.value !== name) {
					updateNode(node.id, { name: event.currentTarget.value })
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
