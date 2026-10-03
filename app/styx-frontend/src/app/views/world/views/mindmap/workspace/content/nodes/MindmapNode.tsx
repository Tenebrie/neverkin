import Box from '@mui/material/Box'
import { useRef, useState } from 'react'

import { MindmapNode as MindmapNodeType } from '@/api/types/mindmapTypes'
import { DragTrigger } from '@/app/features/dragDrop/DragTrigger'
import { useDragDrop } from '@/app/features/dragDrop/hooks/useDragDrop'
import { useDragDropReceiver } from '@/app/features/dragDrop/hooks/useDragDropReceiver'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useMindmapContext, useMindmapNode } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'
import { MindmapNodeParentParcel } from '@/app/views/world/views/mindmap/types'
import { getMindmapDroppedNodeParams } from '@/app/views/world/views/mindmap/utils/getMindmapDroppedNodeParams'
import { useMindmapNodeClicks } from '@/app/views/world/views/mindmap/workspace/content/nodes/hooks/useMindmapNodeClicks'
import { useMindmapNodeDrag } from '@/app/views/world/views/mindmap/workspace/content/nodes/hooks/useMindmapNodeDrag'
import { useMindmapNodeHover } from '@/app/views/world/views/mindmap/workspace/content/nodes/hooks/useMindmapNodeHover'
import { useMindmapNodeLayout } from '@/app/views/world/views/mindmap/workspace/content/nodes/hooks/useMindmapNodeLayout'

import { MindmapNodeRenderer } from './MindmapNodeRenderer'

type Props = {
	nodeId: string
}

type NodeProps = {
	node: MindmapNodeType
	parent: MindmapNodeParentParcel
}

export function MindmapNode({ nodeId }: Props) {
	const boxedNode = useMindmapNode(nodeId)
	if (!boxedNode) {
		return null
	}

	return <MindmapNodeComponent parent={boxedNode.parent} node={boxedNode.node} />
}

function MindmapNodeComponent({ parent, node }: NodeProps) {
	const { reparentNode } = useMindmapContext()
	const ref = useRef<HTMLDivElement>(null)

	const { handleMouseEnter, handleMouseLeave, cancelPendingHover, onDragStart, onDragEnd } =
		useMindmapNodeHover({
			nodeId: node.id,
			entityId: parent.id,
		})

	const { selectedRef, onHeaderClick, onMouseDown, onMouseUp } = useMindmapNodeClicks({
		node,
		parent,
		ref,
		onClick: cancelPendingHover,
	})
	const { moveTo } = useMindmapNodeLayout(node, ref)
	useMindmapNodeDrag({ node, ref, moveTo, selectedRef, onDragStart, onDragEnd })

	const { ref: linkingRef, ghostElement: linkingGhost } = useDragDrop({
		type: 'mindmapNodeLinking',
		ghostFactory: () => null,
		trigger: DragTrigger.MindmapForceNewWire,
		params: {
			sourceNodeId: node.id,
		},
	})

	useDragDropReceiver({
		type: 'articleListItem',
		receiverRef: ref,
		onDrop: ({ params, targetPos }, { markHandled }) => {
			markHandled()
			if (params.article.id === parent.id) {
				return
			}

			const body = getMindmapDroppedNodeParams(params.article, targetPos)
			if (body) {
				reparentNode(node.id, body)
			}
		},
	})

	const [isDropTarget, setIsDropTarget] = useState(false)
	useEventBusSubscribe['mindmap/dropTarget/changed']({
		callback: ({ target }) => setIsDropTarget(target === ref.current),
	})

	useEventBusSubscribe['mindmap/scale/changed']({
		callback: ({ scale }) => {
			ref.current?.style.setProperty('--grid-scale', scale.toString())
		},
	})

	return (
		<Box
			ref={(element: HTMLDivElement | null) => {
				ref.current = element
				linkingRef.current = element
			}}
			data-testid="MindmapNode"
			data-mindmap-node={node.id}
			data-entity-id={parent.id}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			style={
				{
					'--grid-scale': MindmapState.scale,
					'--node-x': `${node.positionX}px`,
					'--node-y': `${node.positionY}px`,
				} as React.CSSProperties
			}
			sx={{
				pointerEvents: 'auto',
				position: 'absolute',
				zIndex: 1,
				// The drag ghost is snapped over this node and stands in for it
				opacity: isDropTarget ? 0 : 1,
				transform:
					'translate(round(var(--node-x) * var(--grid-scale), 1px / var(--dpr)), round(var(--node-y) * var(--grid-scale), 1px / var(--dpr))) scale(var(--grid-scale))',
				transformOrigin: 'top left',
				'&:hover, &[data-dragging="true"]': {
					zIndex: 10,
				},
			}}
		>
			<MindmapNodeRenderer parent={parent} nodeId={node.id} onHeaderClick={onHeaderClick} />
			{linkingGhost}
		</Box>
	)
}
