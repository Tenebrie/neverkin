import Box from '@mui/material/Box'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDispatch, useStore } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { DragTrigger, matchesDragTrigger } from '@/app/features/dragDrop/DragTrigger'
import { useDragDrop } from '@/app/features/dragDrop/hooks/useDragDrop'
import { useDragDropReceiver } from '@/app/features/dragDrop/hooks/useDragDropReceiver'
import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useAutoRef } from '@/app/hooks/useAutoRef'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'
import { usePointerCapture } from '@/app/hooks/usePointerCapture'
import { RootState } from '@/app/store'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import { useMindmapContext, useMindmapNode } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { mindmapSlice } from '@/app/views/world/views/mindmap/MindmapSlice'
import { getSelectedNodeKeys } from '@/app/views/world/views/mindmap/MindmapSliceSelectors'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'
import { MindmapNodeParentParcel } from '@/app/views/world/views/mindmap/types'
import { getMindmapDroppedNodeParams } from '@/app/views/world/views/mindmap/utils/getMindmapDroppedNodeParams'
import { ActorNode } from '@/app/views/world/views/mindmap/workspace/content/nodes/ActorNode'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { NODE_FALLBACK_H, NODE_W } from './mindmapWireUtils'

type Props = {
	nodeId: string
}

type NodeProps = {
	node: MindmapNode
	parent: MindmapNodeParentParcel
}

export function ActorNodePositioner({ nodeId }: Props) {
	const boxedNode = useMindmapNode(nodeId)
	if (!boxedNode) {
		return null
	}

	return <ActorNodePositionerComponent parent={boxedNode.parent} node={boxedNode.node} />
}

function ActorNodePositionerComponent({ parent, node }: NodeProps) {
	const navigate = useStableNavigate({ from: '/world/$worldId/mindmap' })

	const { moveNodes, reparentNode, nodeLayouts, nodeResizeObserver } = useMindmapContext()

	const positionRef = useRef({ x: node.positionX, y: node.positionY })

	const publishPosition = useEvent(() => {
		const { x, y } = positionRef.current
		const current = nodeLayouts.get(node.id)
		nodeLayouts.set(node.id, {
			x,
			y,
			width: current?.width ?? NODE_W,
			height: current?.height ?? NODE_FALLBACK_H,
		})
	})

	useLayoutEffect(() => {
		positionRef.current = { x: node.positionX, y: node.positionY }
		publishPosition()
		const el = ref.current
		if (el) {
			el.style.setProperty('--node-x', `${node.positionX}px`)
			el.style.setProperty('--node-y', `${node.positionY}px`)
		}
	}, [node, publishPosition])

	const selectedRef = useRef(false)
	const store = useStore<RootState>()
	const { addNodeToSelection, removeNodeFromSelection, clearSelections } = mindmapSlice.actions
	const dispatch = useDispatch()

	const { triggerClick } = useDoubleClick<{ multiselect: boolean }>({
		onClick: ({ multiselect }) => {
			clearTimeout(hoverTimeoutRef.current ?? undefined)
			if (selectedRef.current) {
				dispatch(removeNodeFromSelection(node.id))
			} else {
				dispatch(addNodeToSelection({ key: node.id, actorId: parent.id, multiselect }))
			}
		},
		onDoubleClick: () => {
			onContentClick()
			dispatch(addNodeToSelection({ key: node.id, actorId: parent.id, multiselect: false }))
		},
		ignoreDelay: true,
	})

	const onContentClick = useEvent(() => {
		if (parent.type === 'folder') {
			return
		}
		if (parent.type === 'node' && parent.entity.content.length === 0) {
			dispatchGlobalEvent['mindmap/node/requestEditPlainNode']({ nodeId: node.id })
			return
		}
		navigate({
			search: (prev) => ({
				...prev,
				navi: [parent.id],
			}),
		})
	})

	const ref = useRef<HTMLDivElement>(null)

	const { ref: linkingRef, ghostElement: linkingGhost } = useDragDrop({
		type: 'actorNodeLinking',
		ghostFactory: () => null,
		trigger: DragTrigger.MindmapForceNewWire,
		params: {
			sourceNode: node,
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

	useEventBusSubscribe['mindmap/node/onGroupDragStart']({
		callback: ({ sourceNodeId }) => {
			if (sourceNodeId === node.id || !selectedRef.current) {
				return
			}

			setDragHover(true)
		},
	})
	useEventBusSubscribe['mindmap/node/onGroupDragUpdate']({
		callback: ({ sourceNodeId, deltaX, deltaY }) => {
			if (sourceNodeId === node.id || !selectedRef.current) {
				return
			}

			positionRef.current = { x: positionRef.current.x + deltaX, y: positionRef.current.y + deltaY }
			ref.current?.style.setProperty('--node-x', `${positionRef.current.x}px`)
			ref.current?.style.setProperty('--node-y', `${positionRef.current.y}px`)
			publishPosition()
		},
	})
	useEventBusSubscribe['mindmap/node/onGroupDragEnd']({
		callback: ({ sourceNodeId }) => {
			if (sourceNodeId === node.id || !selectedRef.current) {
				return
			}

			setDragHover(false)
		},
	})

	const nodeRef = useAutoRef(node)

	useLayoutEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}
		return nodeResizeObserver.observe(element, (entry) => {
			const { x, y } = positionRef.current
			const { inlineSize, blockSize } = entry.borderBoxSize[0]
			nodeLayouts.set(node.id, { x, y, width: inlineSize, height: blockSize })
		})
	}, [node.id, nodeLayouts, nodeResizeObserver])
	useEffect(
		() => () => {
			nodeLayouts.delete(node.id)
			clearTimeout(hoverTimeoutRef.current ?? undefined)
			dispatch(mindmapSlice.actions.removeNodeFromHover(node.id))
		},
		[dispatch, node.id, nodeLayouts],
	)

	useEventBusSubscribe['mindmap/selection/changed']({
		callback: ({ selectedNodeIds }) => {
			const isSelected = selectedNodeIds.has(node.id)
			selectedRef.current = isSelected
			ref.current?.setAttribute('data-selected', String(isSelected))
		},
	})

	const { addNodeToHover, removeNodeFromHover } = mindmapSlice.actions
	const isDraggingRef = useRef(false)
	const isHoverSuppressedRef = useRef(false)
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const setHovered = useEvent((isHovered: boolean, delay: number) => {
		clearTimeout(hoverTimeoutRef.current ?? undefined)
		hoverTimeoutRef.current = null

		const action = isHovered
			? addNodeToHover({ key: node.id, entityId: parent.id })
			: removeNodeFromHover(node.id)

		if (delay === 0) {
			dispatch(action)
		} else {
			hoverTimeoutRef.current = setTimeout(() => dispatch(action), delay)
		}
	})

	const setDragHover = useEvent((isDragging: boolean) => {
		isDraggingRef.current = isDragging
		ref.current?.setAttribute('data-dragging', String(isDragging))
		if (isDragging) {
			setHovered(false, 0)
		}
	})

	const handleMouseEnter = useEvent((event: React.MouseEvent) => {
		if (isDraggingRef.current || isHoverSuppressedRef.current || event.buttons !== 0) {
			return
		}
		setHovered(true, 600)
	})

	const handleMouseLeave = useEvent(() => {
		if (isDraggingRef.current) {
			return
		}
		isHoverSuppressedRef.current = false
		setHovered(false, 0)
	})

	const { capture: capturePointer, release: releasePointer } = usePointerCapture()

	useEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}

		const mouseState = {
			isButtonDown: false,
			positionX: positionRef.current.x,
			positionY: positionRef.current.y,
			gridScale: 1,

			isDragging: false,
			deltaX: 0,
			deltaY: 0,
		}

		const handleMouseDown = (event: MouseEvent) => {
			if (event.button !== 0) {
				return
			}
			event.stopPropagation()

			const isMoveTrigger = matchesDragTrigger(event, DragTrigger.MoveElements)
			if (!isMoveTrigger) {
				return
			}

			if (!selectedRef.current && !isMultiselectEvent(event)) {
				dispatch(clearSelections())
			}

			mouseState.positionX = positionRef.current.x
			mouseState.positionY = positionRef.current.y
			mouseState.isButtonDown = true
			mouseState.gridScale = MindmapState.scale
			window.addEventListener('pointermove', handleMouseMove)
			window.addEventListener('pointerup', handleMouseUp)
		}

		const handleMouseWheel = (event: WheelEvent) => {
			if (mouseState.isDragging) {
				event.stopPropagation()
				event.preventDefault()
			}
		}

		const handleMouseMove = (event: PointerEvent) => {
			mouseState.deltaX += event.movementX
			mouseState.deltaY += event.movementY

			if (!mouseState.isDragging && (Math.abs(mouseState.deltaX) > 3 || Math.abs(mouseState.deltaY) > 3)) {
				mouseState.isDragging = true
				isHoverSuppressedRef.current = true
				setDragHover(true)
				capturePointer('grabbing', event.pointerId)
				dispatchGlobalEvent['mindmap/node/onGroupDragStart']({
					sourceNodeId: node.id,
				})
			}

			if (mouseState.isDragging) {
				mouseState.positionX += mouseState.deltaX / mouseState.gridScale
				mouseState.positionY += mouseState.deltaY / mouseState.gridScale
				positionRef.current = { x: mouseState.positionX, y: mouseState.positionY }
				element.style.setProperty('--node-x', `${mouseState.positionX}px`)
				element.style.setProperty('--node-y', `${mouseState.positionY}px`)
				publishPosition()
				dispatchGlobalEvent['mindmap/node/onGroupDragUpdate']({
					sourceNodeId: node.id,
					deltaX: mouseState.deltaX / mouseState.gridScale,
					deltaY: mouseState.deltaY / mouseState.gridScale,
				})

				mouseState.deltaX = 0
				mouseState.deltaY = 0
			}
		}

		const handleMouseUp = (event: PointerEvent) => {
			if (event.button !== 0 || !mouseState.isButtonDown) {
				return
			}

			mouseState.isButtonDown = false
			mouseState.deltaX = 0
			mouseState.deltaY = 0
			window.removeEventListener('pointermove', handleMouseMove)
			window.removeEventListener('pointerup', handleMouseUp)

			if (!mouseState.isDragging) {
				return
			}
			mouseState.isDragging = false

			const snappedPosition = {
				x: Math.round(positionRef.current.x),
				y: Math.round(positionRef.current.y),
			}

			positionRef.current = snappedPosition
			element.style.setProperty('--node-x', `${snappedPosition.x}px`)
			element.style.setProperty('--node-y', `${snappedPosition.y}px`)

			const totalDeltaX = snappedPosition.x - nodeRef.current.positionX
			const totalDeltaY = snappedPosition.y - nodeRef.current.positionY

			moveNodes({
				nodeIds: [...new Set(getSelectedNodeKeys(store.getState()).concat(nodeRef.current.id))],
				deltaX: totalDeltaX,
				deltaY: totalDeltaY,
			})

			publishPosition()
			dispatchGlobalEvent['mindmap/node/onGroupDragUpdate']({
				sourceNodeId: node.id,
				deltaX: snappedPosition.x - mouseState.positionX,
				deltaY: snappedPosition.y - mouseState.positionY,
			})
			dispatchGlobalEvent['mindmap/node/onGroupDragEnd']({
				sourceNodeId: node.id,
			})

			setDragHover(false)
			releasePointer()
		}

		element.addEventListener('pointerdown', handleMouseDown)
		element.addEventListener('wheel', handleMouseWheel)

		return () => {
			element.removeEventListener('pointerdown', handleMouseDown)
			element.removeEventListener('wheel', handleMouseWheel)
			window.removeEventListener('pointermove', handleMouseMove)
			window.removeEventListener('pointerup', handleMouseUp)
		}
	}, [
		positionRef,
		node.id,
		nodeRef,
		store,
		dispatch,
		clearSelections,
		selectedRef,
		setDragHover,
		moveNodes,
		capturePointer,
		releasePointer,
		publishPosition,
	])

	const { onMouseDown, onMouseUp } = useDraggableClick({
		onRightClick: (event) => {
			const state = store.getState().mindmap
			const isBulkSelectContext =
				state.selectedNodes.length + state.selectedWires.length > 1 &&
				state.selectedNodes.some((selectedNode) => selectedNode.key === node.id)
			if (isBulkSelectContext) {
				dispatchGlobalEvent['mindmap/bulk/requestOpenContextMenu']({
					position: {
						x: event.clientX,
						y: event.clientY,
					},
				})
			} else {
				dispatch(addNodeToSelection({ key: node.id, actorId: parent.id, multiselect: false }))
				dispatchGlobalEvent['mindmap/node/requestOpenContextMenu']({
					position: {
						x: event.clientX,
						y: event.clientY,
					},
					node,
					parent,
				})
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

	const onHeaderClick = useCallback(
		(e: React.MouseEvent) => triggerClick(e, { multiselect: isMultiselectEvent(e) }),
		[triggerClick],
	)

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
			<ActorNode parent={parent} node={node} onHeaderClick={onHeaderClick} onContentClick={onContentClick} />
			{linkingGhost}
		</Box>
	)
}
