import Box from '@mui/material/Box'
import { darken, lighten } from '@mui/material/styles'
import React, { useCallback, useRef } from 'react'
import { useStore } from 'react-redux'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useDragDropReceiver } from '@/app/features/dragDrop/hooks/useDragDropReceiver'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { RootState } from '@/app/store'

import { BoxedMindmapParent } from '../hooks/useBoxedMindmapContent'
import { useNodeLinking } from '../hooks/useNodeLinking'
import { getSelectedNodeKeys } from '../MindmapSliceSelectors'
import { ActorNodeContent } from './ActorNodeContent'
import { ActorNodeContentStickyNote } from './ActorNodeContentStickyNote'

type Props = {
	node: MindmapNode
	parent: BoxedMindmapParent
	onHeaderClick: (e: React.MouseEvent) => void
	onContentClick: () => void
}

export function ActorNode({ parent, node, onHeaderClick, onContentClick }: Props) {
	const { createLinks, checkLinkExists } = useNodeLinking()
	const store = useStore<RootState>()

	const theme = useCustomTheme()
	const isStickyNote = parent.type === 'node' && parent.entity.content.length === 0

	const { ref } = useDragDropReceiver({
		type: 'actorNodeLinking',
		onDrop: (data) => {
			const sourceNodeId = data.params.sourceNode.id
			const selectedNodeKeys = getSelectedNodeKeys(store.getState())
			const sourceIds = selectedNodeKeys.includes(sourceNodeId)
				? [...new Set(selectedNodeKeys)]
				: [sourceNodeId]

			createLinks(
				sourceIds.map((srcId) => ({
					sourceNodeId: srcId,
					targetNodeId: node.id,
				})),
			)
		},
	})

	const isDimmedRef = useRef(false)
	const setDimmed = useCallback(
		(dimmed: boolean) => {
			if (isDimmedRef.current === dimmed || !ref.current) {
				return
			}
			isDimmedRef.current = dimmed
			if (dimmed) {
				ref.current.style.opacity = '0.35'
			} else {
				ref.current.style.opacity = '1.0'
			}
		},
		[ref],
	)

	useEventBusSubscribe['mindmap/hover/changed']({
		callback: ({ hoveredNodeIds }) => {
			if (!ref.current) {
				return
			}
			if (hoveredNodeIds.size === 0 || hoveredNodeIds.has(node.id)) {
				setDimmed(false)
				return
			}

			const anyHovered = [...hoveredNodeIds].some((nodeId) => checkLinkExists(node.id, nodeId))
			if (anyHovered) {
				setDimmed(false)
			} else {
				setDimmed(true)
			}
		},
	})

	useEventBusSubscribe['mindmap/scale/changed']({
		callback: ({ scale }) => {
			const el = ref.current
			if (!el) {
				return
			}
			el.style.setProperty('--grid-scale', scale.toString())
		},
	})

	return (
		<Box
			ref={ref}
			sx={{
				background: theme.custom.palette.background.timeline,

				// Non-scaling border
				borderRadius: '15px',
				boxShadow: 'inset 0 0 0 var(--node-border-width) var(--node-border-color)',
				'--node-border-width': 'calc(1px / var(--grid-scale))',
				'--node-border-color': theme.material.palette.divider,
				transition: 'opacity 0.2s, --node-border-color 0.2s ease-out',
				'[data-selected="true"] > &': {
					'--node-border-color': theme.material.palette.primary.main,
					'&:hover': {
						'--node-border-color': lighten(theme.material.palette.primary.main, 0.0),
					},
					'&:active': {
						'--node-border-color': darken(theme.material.palette.primary.main, 0.3),
					},
				},
				'&:hover': {
					'--node-border-color': darken(theme.custom.palette.highlight, 0.0),
				},
				'&:active': {
					'--node-border-color': darken(theme.custom.palette.highlight, 0.3),
				},
			}}
		>
			{isStickyNote ? (
				<ActorNodeContentStickyNote node={node} parent={parent} onHeaderClick={onHeaderClick} />
			) : (
				<ActorNodeContent
					node={node}
					parent={parent}
					onHeaderClick={onHeaderClick}
					onContentClick={onContentClick}
				/>
			)}
		</Box>
	)
}
