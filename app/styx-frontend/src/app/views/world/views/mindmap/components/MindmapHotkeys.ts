import { useDispatch, useSelector } from 'react-redux'

import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { useDeleteMindmapNodes } from '../api/useDeleteMindmapNodes'
import { useDeleteMindmapWires } from '../api/useDeleteMindmapWires'
import { useMindmapContext } from '../context/useMindmapContext'
import { mindmapSlice } from '../MindmapSlice'
import { getSelectedNodeKeys, getSelectedWireKeys } from '../MindmapSliceSelectors'

export function MindmapHotkeys() {
	const selectedNodes = useSelector(getSelectedNodeKeys)
	const selectedWires = useSelector(getSelectedWireKeys)
	const [deleteMindmapNodes] = useDeleteMindmapNodes()
	const [deleteMindmapWires] = useDeleteMindmapWires()
	const { nodes } = useMindmapContext()
	const navigate = useStableNavigate({ from: '/world/$worldId/mindmap' })

	const { clearSelections } = mindmapSlice.actions
	const dispatch = useDispatch()

	useShortcut(
		Shortcut.EditSelected,
		() => {
			const parcel = nodes.get(selectedNodes[0])
			if (!parcel || parcel.parent.type === 'folder') {
				return
			}
			const { node, parent } = parcel
			if (parent.type === 'node' && parent.entity.content.length === 0) {
				dispatchGlobalEvent['mindmap/node/requestEditPlainNode']({ nodeId: node.id })
			} else {
				navigate({ search: (prev) => ({ ...prev, navi: [parent.id] }) })
			}
		},
		selectedNodes.length === 1,
	)

	useShortcut(
		Shortcut.DeleteSelected,
		() => {
			if (selectedNodes.length > 0) {
				deleteMindmapNodes(selectedNodes)
			}
			if (selectedWires.length > 0) {
				deleteMindmapWires(selectedWires)
			}
			dispatch(clearSelections())
		},
		selectedNodes.length > 0 || selectedWires.length > 0,
	)
	return null
}
