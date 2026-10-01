import { useDispatch, useSelector } from 'react-redux'

import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'

import { useDeleteMindmapNodes } from '../api/useDeleteMindmapNodes'
import { useDeleteMindmapWires } from '../api/useDeleteMindmapWires'
import { mindmapSlice } from '../MindmapSlice'
import { getSelectedNodeKeys, getSelectedWireKeys } from '../MindmapSliceSelectors'

export function MindmapHotkeys() {
	const selectedNodes = useSelector(getSelectedNodeKeys)
	const selectedWires = useSelector(getSelectedWireKeys)
	const [deleteMindmapNodes] = useDeleteMindmapNodes()
	const [deleteMindmapWires] = useDeleteMindmapWires()

	const { clearSelections } = mindmapSlice.actions
	const dispatch = useDispatch()

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
