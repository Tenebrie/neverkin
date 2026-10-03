import Box from '@mui/material/Box'
import { SxProps, Theme } from '@mui/material/styles'
import { ReactNode, useCallback, useState } from 'react'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useEventBusSubscribe } from '@/app/features/eventBus'

import { useUpdateMindmapNode } from '../../../api/useUpdateMindmapNode'

type Props = {
	node?: MindmapNode
	name: string
	sx: SxProps<Theme>
	children: ReactNode
}

export function ActorNodeName({ node, name, sx, children }: Props) {
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
		return children
	}

	return (
		<Box
			component="textarea"
			ref={attachTextarea}
			defaultValue={name}
			rows={1}
			onInput={(event: React.FormEvent<HTMLTextAreaElement>) => fitToContent(event.currentTarget)}
			onClick={(event: React.MouseEvent) => event.stopPropagation()}
			onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
				if (event.key === 'Escape') {
					event.currentTarget.value = name
					event.currentTarget.blur()
				} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
					event.currentTarget.blur()
				}
			}}
			onBlur={(event: React.FocusEvent<HTMLTextAreaElement>) => {
				setIsEditing(false)
				if (event.currentTarget.value !== name) {
					updateNode(node.id, { name: event.currentTarget.value })
				}
			}}
			sx={[
				{
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
					font: 'inherit',
					userSelect: 'text',
				},
				...(Array.isArray(sx) ? sx : [sx]),
			]}
		/>
	)
}

function fitToContent(element: HTMLTextAreaElement) {
	element.style.height = 'auto'
	element.style.height = `${element.scrollHeight}px`
}

function stopPropagation(event: Event) {
	event.stopPropagation()
}
