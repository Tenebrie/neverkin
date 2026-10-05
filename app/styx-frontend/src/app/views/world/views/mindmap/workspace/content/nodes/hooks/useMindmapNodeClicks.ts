import { RefObject, useCallback, useLayoutEffect, useRef } from 'react'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import { useMindmapSelectionContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
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
	const { selectedNodes, selectedWires, addNodeToSelection, removeNodeFromSelection } =
		useMindmapSelectionContext()
	const selectedRef = useRef(false)

	useLayoutEffect(() => {
		if (selectedNodes.has(node.id)) {
			selectedRef.current = true
			ref.current?.setAttribute('data-selected', 'true')
		}
		return selectedNodes.subscribe(node.id, () => {
			const isSelected = selectedNodes.has(node.id)
			selectedRef.current = isSelected
			ref.current?.setAttribute('data-selected', String(isSelected))
		})
	}, [node.id, ref, selectedNodes])

	const { triggerClick } = useDoubleClick<{ multiselect: boolean }>({
		onClick: ({ multiselect }) => {
			onClick()
			if (selectedRef.current) {
				removeNodeFromSelection(node.id)
			} else {
				addNodeToSelection({ id: node.id, multiselect })
			}
		},
		onDoubleClick: () => {
			addNodeToSelection({ id: node.id, multiselect: false })
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
			const isBulkSelectContext =
				selectedNodes.size() + selectedWires.size() > 1 && selectedNodes.has(node.id)
			if (isBulkSelectContext) {
				dispatchGlobalEvent['mindmap/bulk/requestOpenContextMenu']({
					position: {
						x: event.clientX,
						y: event.clientY,
					},
				})
			} else {
				addNodeToSelection({ id: node.id, multiselect: false })
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
