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
import { RootState } from '@/app/store'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { BoxedMindmapParent } from '../hooks/useBoxedMindmapContent'
import { useMindmapNode } from '../hooks/useMindmapContentStore'
import { mindmapSlice } from '../MindmapSlice'
import { getSelectedNodeKeys } from '../MindmapSliceSelectors'
import { getMindmapDroppedNodeParams } from '../utils/getMindmapDroppedNodeParams'
import { MindmapState } from '../utils/MindmapState'
import { ActorNode } from './ActorNode'
import { nodePositions } from './mindmapWireUtils'

type Props = {
	nodeId: string
}

type NodeProps = {
	node: MindmapNode
	parent: BoxedMindmapParent
}

/**
 * Subscribes to this one node in the content store, so an edit elsewhere on the mindmap never
 * reaches this component.
 */
export function ActorNodePositioner({ nodeId }: Props) {
	const boxedNode = useMindmapNode(nodeId)
	if (!boxedNode) {
		return null
	}

	return <ActorNodePositionerComponent parent={boxedNode.parent} node={boxedNode.node} />
}

function ActorNodePositionerComponent({ parent, node }: NodeProps) {
	const navigate = useStableNavigate({ from: '/world/$worldId/mindmap' })

	const positionRef = useRef({ x: node.positionX, y: node.positionY })

	useLayoutEffect(() => {
		positionRef.current = { x: node.positionX, y: node.positionY }
		const el = ref.current
		if (el) {
			el.style.setProperty('--node-x', `${node.positionX}px`)
			el.style.setProperty('--node-y', `${node.positionY}px`)
		}
	}, [node])

	const selectedRef = useRef(false)
	const store = useStore<RootState>()
	const { addNodeToSelection, removeNodeFromSelection, clearSelections } = mindmapSlice.actions
	const dispatch = useDispatch()

	const { triggerClick } = useDoubleClick<{ multiselect: boolean }>({
		onClick: ({ multiselect }) => {
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
				dispatchGlobalEvent['mindmap/node/requestReparent']({ nodeId: node.id, body })
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
			nodePositions.set(node.id, {
				...positionRef.current,
				height: nodePositions.get(node.id)?.height ?? 80,
			})
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

	// TODO: Get this working again
	const cachedHeight = useRef<number | null>(null)
	useLayoutEffect(() => {
		const el = ref.current
		const height = (() => {
			if (cachedHeight.current !== null) {
				return cachedHeight.current
			}
			if (!el) {
				return 80
			}
			cachedHeight.current = el.getBoundingClientRect().height / MindmapState.scale
			return cachedHeight.current
		})()
		// const height = el ? el.getBoundingClientRect().height / MindmapState.scale : 80
		nodePositions.set(node.id, { ...positionRef.current, height })
	})
	useEffect(
		() => () => {
			nodePositions.delete(node.id)
			clearTimeout(hoverTimeoutRef.current ?? undefined)
			dispatch(mindmapSlice.actions.removeNodeFromHover(node.id))
		},
		[dispatch, node.id],
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
			setHovered(true, 0)
		} else if (!ref.current?.matches(':hover')) {
			setHovered(false, 0)
		}
	})

	const handleMouseEnter = useEvent(() => {
		if (isDraggingRef.current) {
			return
		}
		setHovered(true, 100)
	})

	const handleMouseLeave = useEvent(() => {
		if (isDraggingRef.current) {
			return
		}
		setHovered(false, 0)
	})

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
			canClick: true,

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
			window.addEventListener('mousemove', handleMouseMove)
			window.addEventListener('mouseup', handleMouseUp)
		}

		const handleMouseClick = (event: MouseEvent) => {
			if (!mouseState.canClick) {
				event.stopPropagation()
				event.preventDefault()
			}
			mouseState.canClick = true
		}

		const handleMouseWheel = (event: WheelEvent) => {
			if (mouseState.isDragging) {
				event.stopPropagation()
				event.preventDefault()
			}
		}

		const handleMouseMove = (event: MouseEvent) => {
			mouseState.deltaX += event.movementX
			mouseState.deltaY += event.movementY

			if (!mouseState.isDragging && (Math.abs(mouseState.deltaX) > 3 || Math.abs(mouseState.deltaY) > 3)) {
				mouseState.isDragging = true
				mouseState.canClick = false
				setDragHover(true)
				window.document.body.classList.add('cursor-grabbing', 'mouse-busy')
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
				nodePositions.set(node.id, {
					...positionRef.current,
					height: nodePositions.get(node.id)?.height ?? 80,
				})
				dispatchGlobalEvent['mindmap/node/onGroupDragUpdate']({
					sourceNodeId: node.id,
					deltaX: mouseState.deltaX / mouseState.gridScale,
					deltaY: mouseState.deltaY / mouseState.gridScale,
				})
				dispatchGlobalEvent['mindmap/node/onMove']({
					nodeId: node.id,
					positionX: mouseState.positionX,
					positionY: mouseState.positionY,
				})

				mouseState.deltaX = 0
				mouseState.deltaY = 0
			}
		}

		const handleMouseUp = (event: MouseEvent) => {
			if (event.button !== 0 || !mouseState.isButtonDown) {
				return
			}

			const snappedPosition = {
				x: Math.round(positionRef.current.x / 1) * 1,
				y: Math.round(positionRef.current.y / 1) * 1,
			}

			positionRef.current = snappedPosition
			element.style.setProperty('--node-x', `${snappedPosition.x}px`)
			element.style.setProperty('--node-y', `${snappedPosition.y}px`)

			const totalDeltaX = snappedPosition.x - nodeRef.current.positionX
			const totalDeltaY = snappedPosition.y - nodeRef.current.positionY

			dispatchGlobalEvent['mindmap/node/requestMove']({
				nodeIds: [...new Set(getSelectedNodeKeys(store.getState()).concat(nodeRef.current.id))],
				deltaX: totalDeltaX,
				deltaY: totalDeltaY,
			})

			nodePositions.set(node.id, { ...snappedPosition, height: nodePositions.get(node.id)?.height ?? 80 })
			dispatchGlobalEvent['mindmap/node/onGroupDragUpdate']({
				sourceNodeId: node.id,
				deltaX: snappedPosition.x - mouseState.positionX,
				deltaY: snappedPosition.y - mouseState.positionY,
			})
			dispatchGlobalEvent['mindmap/node/onMove']({
				nodeId: node.id,
				positionX: snappedPosition.x,
				positionY: snappedPosition.y,
			})
			dispatchGlobalEvent['mindmap/node/onGroupDragEnd']({
				sourceNodeId: node.id,
			})

			mouseState.isButtonDown = false
			mouseState.isDragging = false
			mouseState.deltaX = 0
			mouseState.deltaY = 0
			setDragHover(false)
			window.document.body.classList.remove('cursor-grabbing', 'mouse-busy')
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}

		element.addEventListener('mousedown', handleMouseDown)
		element.addEventListener('click', handleMouseClick)
		element.addEventListener('wheel', handleMouseWheel)

		return () => {
			element.removeEventListener('mousedown', handleMouseDown)
			element.removeEventListener('click', handleMouseClick)
			element.removeEventListener('wheel', handleMouseWheel)
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [positionRef, node.id, nodeRef, store, dispatch, clearSelections, selectedRef, setDragHover])

	const { onMouseDown, onMouseUp } = useDraggableClick({
		onRightClick: (event) => {
			const state = store.getState().mindmap
			const isBulkSelectContext = state.selectedNodes.length + state.selectedWires.length > 1
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
				// The drag ghost is snapped over this node and stands in for it
				opacity: isDropTarget ? 0 : 1,
				transform:
					'translate(calc(var(--node-x) * var(--grid-scale)), calc(var(--node-y) * var(--grid-scale))) scale(var(--grid-scale))',
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
