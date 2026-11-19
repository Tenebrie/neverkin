import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { useReactiveMapKeys } from '@/app/features/reactivity/useReactiveMap'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { useMindmapContext, useMindmapSelectionContext } from '../context/useMindmapContext'

export function MindmapHotkeys() {
	const { nodes, deleteNodes, deleteWires, deleteWaypoints } = useMindmapContext()
	const navigate = useStableNavigate({ from: '/world/$worldId/mindmap' })

	const {
		selectedNodes: selectedNodesMap,
		selectedWires: selectedWiresMap,
		selectedWaypoints: selectedWaypointsMap,
		clearSelections,
	} = useMindmapSelectionContext()
	const selectedNodes = useReactiveMapKeys(selectedNodesMap)
	const selectedWires = useReactiveMapKeys(selectedWiresMap)
	const selectedWaypoints = useReactiveMapKeys(selectedWaypointsMap)

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
				deleteNodes(selectedNodes)
			}
			if (selectedWires.length > 0) {
				deleteWires(selectedWires)
			}
			if (selectedWaypoints.length > 0) {
				deleteWaypoints(selectedWaypoints)
			}
			clearSelections()
		},
		selectedNodes.length > 0 || selectedWires.length > 0 || selectedWaypoints.length > 0,
	)
	return null
}
