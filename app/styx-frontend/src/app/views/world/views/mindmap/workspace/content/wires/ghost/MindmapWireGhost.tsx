import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useRealtimeContext } from '@/app/components/RealtimeContext'
import { useDragDropEnded } from '@/app/features/dragDrop/hooks/useDragDropEnded'
import { useDragDropStarted } from '@/app/features/dragDrop/hooks/useDragDropStarted'
import { useDragDropState } from '@/app/features/dragDrop/hooks/useDragDropState'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { RootState } from '@/app/store'
import { isNotNull } from '@/app/utils/isNotNull'

import { useMindmapContext } from '../../../../context/useMindmapContext'
import { getSelectedNodeKeys } from '../../../../MindmapSliceSelectors'
import { getNodeHeight } from '../../../../unrefactored/mindmapWireUtils'
import { toWorkspaceCoords } from '../../../../utils/toWorkspaceCoords'
import { MindmapWireGhostContext } from './context/MindmapWireGhostContext'
import { MindmapWireGhostLine } from './MindmapWireGhostLine'

type Props = {
	svgGroupPortal: SVGGElement
}

export function MindmapWireGhost({ svgGroupPortal }: Props) {
	const { nodes, wires } = useMindmapContext()
	const store = useStore<RootState>()
	const { paint } = useRealtimeContext(MindmapWireGhostContext)

	const [sourceNodes, setSourceNodes] = useState<MindmapNode[]>([])
	const [awaitingSelection, setAwaitingSelection] = useState(false)
	const wirePairs = useRef(new Set<string>())
	const isAwaitingSelection = useRef(false)

	const clearGhost = useEvent(() => {
		isAwaitingSelection.current = false
		setAwaitingSelection(false)
		setSourceNodes([])
	})

	useDragDropStarted({
		type: 'actorNodeLinking',
		callback: ({ params }) => {
			const sourceId = params.sourceNode.id
			const selectedKeys = getSelectedNodeKeys(store.getState())
			const sourceIds = selectedKeys.includes(sourceId) ? selectedKeys : [sourceId]

			wirePairs.current = new Set(
				wires.values().map((wire) => `${wire.sourceNode.id}->${wire.targetNode.id}`),
			)

			const filteredNodes = sourceIds
				.map((id) => nodes.get(id))
				.filter(isNotNull)
				.map((parcel) => parcel.node)

			setSourceNodes(filteredNodes)
		},
	})

	useDragDropEnded({
		type: 'actorNodeLinking',
		callback: () => {
			if (!isAwaitingSelection.current) {
				clearGhost()
			}
		},
	})

	const { getState: getDragDropState } = useDragDropState()

	useEventBusSubscribe['mindmap/wire/requestNodeTarget']({
		callback: () => {
			isAwaitingSelection.current = true
			setAwaitingSelection(true)
		},
	})

	useEventBusSubscribe['quickSelect/onClosed']({
		condition: () => isAwaitingSelection.current,
		callback: clearGhost,
	})

	const findSnapTarget = () => {
		const hovered = getDragDropState()?.hovered ?? []
		for (const element of hovered) {
			const nodeId = element.closest('[data-mindmap-node]')?.getAttribute('data-mindmap-node')
			if (!nodeId || sourceNodes.some((node) => node.id === nodeId)) {
				continue
			}
			const parcel = nodes.get(nodeId)
			if (!parcel) {
				continue
			}
			return {
				id: nodeId,
				x: parcel.node.positionX,
				y: parcel.node.positionY,
				height: getNodeHeight(nodeId),
			}
		}
		return null
	}

	const onMouseMove = useEvent((event: MouseEvent) => {
		const mouse = toWorkspaceCoords({
			screenX: event.clientX,
			screenY: event.clientY,
		})
		if (!mouse) {
			return
		}

		paint({
			mouseX: mouse.x,
			mouseY: mouse.y,
			target: findSnapTarget(),
			wirePairs: wirePairs.current,
		})
	})

	useEffect(() => {
		if (awaitingSelection || sourceNodes.length === 0) {
			return
		}
		window.addEventListener('mousemove', onMouseMove)
		return () => {
			window.removeEventListener('mousemove', onMouseMove)
		}
	}, [awaitingSelection, sourceNodes, onMouseMove])

	if (sourceNodes.length === 0) {
		return null
	}

	return createPortal(
		<g pointerEvents="none">
			{sourceNodes.map((node) => (
				<MindmapWireGhostLine key={node.id} node={node} />
			))}
		</g>,
		svgGroupPortal,
	)
}
