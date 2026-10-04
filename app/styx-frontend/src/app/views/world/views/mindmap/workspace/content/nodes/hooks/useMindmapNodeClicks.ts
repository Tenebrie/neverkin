import { RefObject, useCallback, useLayoutEffect, useRef } from 'react'
import { useDispatch, useStore } from 'react-redux'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'
import { RootState } from '@/app/store'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { mindmapSlice } from '@/app/views/world/views/mindmap/MindmapSlice'
import { MindmapNodeParentParcel } from '@/app/views/world/views/mindmap/types'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

type Props = {
	node: MindmapNode
	parent: MindmapNodeParentParcel
	ref: RefObject<HTMLDivElement | null>
	onClick: () => void
}

export function useMindmapNodeClicks({ node, parent, ref, onClick }: Props) {
	const navigate = useStableNavigate({ from: '/world/$worldId/mindmap' })
	const store = useStore<RootState>()
	const dispatch = useDispatch()
	const { addNodeToSelection, removeNodeFromSelection } = mindmapSlice.actions
	const selectedRef = useRef(false)
	const { selectedNodesCache } = useMindmapContext()

	// TODO: Unify the two paths into a ReactiveMap in context
	useEventBusSubscribe['mindmap/selection/changed']({
		callback: ({ selectedNodeIds }) => {
			const isSelected = selectedNodeIds.has(node.id)
			selectedRef.current = isSelected
			ref.current?.setAttribute('data-selected', String(isSelected))
		},
	})

	useLayoutEffect(() => {
		if (selectedNodesCache.current.some((entry) => entry.key === node.id)) {
			selectedRef.current = true
			ref.current?.setAttribute('data-selected', 'true')
		}
	}, [node.id, ref, selectedNodesCache])

	const { triggerClick } = useDoubleClick<{ multiselect: boolean }>({
		onClick: ({ multiselect }) => {
			onClick()
			if (selectedRef.current) {
				dispatch(removeNodeFromSelection(node.id))
			} else {
				dispatch(addNodeToSelection({ key: node.id, actorId: parent.id, multiselect }))
			}
		},
		onDoubleClick: () => {
			dispatch(addNodeToSelection({ key: node.id, actorId: parent.id, multiselect: false }))
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
		},
		ignoreDelay: true,
	})

	const onHeaderClick = useCallback(
		(e: React.MouseEvent) => triggerClick(e, { multiselect: isMultiselectEvent(e) }),
		[triggerClick],
	)

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

	return { selectedRef, onHeaderClick, onMouseDown, onMouseUp }
}
