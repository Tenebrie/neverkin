import Box from '@mui/material/Box'
import { darken, lighten } from '@mui/material/styles'
import React, { memo, useCallback, useRef } from 'react'
import { useStore } from 'react-redux'

import { useDragDropReceiver } from '@/app/features/dragDrop/hooks/useDragDropReceiver'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { RootState } from '@/app/store'
import { useNodeLinking } from '@/app/views/world/views/mindmap/hooks/useNodeLinking'
import { getSelectedNodeKeys } from '@/app/views/world/views/mindmap/MindmapSliceSelectors'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'
import { MindmapNodeParentParcel } from '@/app/views/world/views/mindmap/types'

import { ActorNodeContent } from './content/ActorNodeContent'
import { ActorNodeContentStickyNote } from './content/ActorNodeContentStickyNote'

export const NODE_W = 300
export const NODE_FALLBACK_H = 60

type Props = {
	nodeId: string
	parent: MindmapNodeParentParcel
	onHeaderClick: (e: React.MouseEvent) => void
}

export const ActorNode = memo(ActorNodeComponent)

function ActorNodeComponent({ parent, nodeId, onHeaderClick }: Props) {
	const { createLinks } = useNodeLinking()
	const store = useStore<RootState>()

	const theme = useCustomTheme()
	const isStickyNote = parent.type === 'node' && parent.entity.content.length === 0

	const { ref } = useDragDropReceiver({
		type: 'actorNodeLinking',
		onDrop: (data) => {
			const sourceNodeId = data.params.sourceNodeId
			const selectedNodeKeys = getSelectedNodeKeys(store.getState())
			const sourceIds = selectedNodeKeys.includes(sourceNodeId)
				? [...new Set(selectedNodeKeys)]
				: [sourceNodeId]

			createLinks(
				sourceIds.map((srcId) => ({
					sourceNodeId: srcId,
					targetNodeId: nodeId,
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
		callback: ({ hoveredNodeIds, highlightedWireIds }) => {
			if (!ref.current) {
				return
			}
			setDimmed(hoveredNodeIds.size > 0 && !hoveredNodeIds.has(nodeId) && !highlightedWireIds.has(nodeId))
		},
	})

	useEventBusSubscribe['mindmap/scale/commit']({
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
				'--grid-scale': MindmapState.scale.toString(),
				background: theme.custom.palette.background.timeline,
				// Non-scaling border
				transition: 'opacity 0.25s',
				borderRadius: '15px',
				boxShadow: 'inset 0 0 0 var(--node-border-width) var(--node-border-color)',
				'--node-border-width': 'calc(1px / var(--grid-scale))',
				'--node-border-color': theme.material.palette.divider,
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
				<ActorNodeContentStickyNote nodeId={nodeId} parent={parent} onHeaderClick={onHeaderClick} />
			) : (
				<ActorNodeContent nodeId={nodeId} parent={parent} onHeaderClick={onHeaderClick} />
			)}
		</Box>
	)
}
