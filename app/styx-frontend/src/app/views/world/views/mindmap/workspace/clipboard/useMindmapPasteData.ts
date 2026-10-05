import { type MindmapPasteData } from '@neverkin/zod-schema'
import useEvent from 'react-use-event-hook'

import { useMousePositionRef } from '@/app/hooks/useMousePositionRef'

import { usePasteMindmapNodes } from '../../api/usePasteMindmapNodes'
import { useMindmapContext, useMindmapSelectionContext } from '../../context/useMindmapContext'
import { getWireDirection } from '../../utils/getWireDirection'
import { toWorkspaceCoords } from '../../utils/toWorkspaceCoords'

export function useMindmapPasteData() {
	const [pasteNodes] = usePasteMindmapNodes()
	const { nodes, nodeLayouts, wires } = useMindmapContext()

	const {
		selectedNodes: selectedNodesMap,
		selectedWires: selectedWiresMap,
		setNodeSelection,
		setWireSelection,
	} = useMindmapSelectionContext()

	const mousePositionRef = useMousePositionRef()

	const getCurrentSelection = useEvent(() => {
		const selectedNodes = selectedNodesMap
			.keys()
			.map((node) => {
				const parcel = nodes.get(node)
				const layout = nodeLayouts.get(node)
				if (!parcel || !layout) {
					return null
				}
				return {
					id: node,
					parcel,
					layout,
				}
			})
			.filter((node) => node !== null)

		const selectedWires = selectedWiresMap
			.keys()
			.map((wire) => {
				const parcel = wires.get(wire)
				if (!parcel) {
					return null
				}
				return {
					id: wire,
					...parcel,
				}
			})
			.filter((wire) => wire !== null)
		return { selectedNodes, selectedWires }
	})

	const createPasteData = useEvent(() => {
		const structuredData: MindmapPasteData = {
			nodes: [],
			internalLinks: [],
			externalLinks: [],
		}

		const { selectedNodes, selectedWires } = getCurrentSelection()
		if (selectedNodes.length === 0) {
			return null
		}

		const remappedNodeIds = new Map<string, string>()

		selectedNodes.forEach((node, index) => {
			remappedNodeIds.set(node.id, `remapped-${index}`)
		})

		const nodePositionSum = selectedNodes.reduce(
			(total, { parcel, layout }) => {
				return {
					x: total.x + parcel.node.positionX + layout.width / 2,
					y: total.y + parcel.node.positionY + layout.height / 2,
				}
			},
			{
				x: 0,
				y: 0,
			},
		)
		const geometricCenter = {
			x: nodePositionSum.x / selectedNodes.length,
			y: nodePositionSum.y / selectedNodes.length,
		}

		selectedNodes.forEach((nodeEntry) => {
			const myTempId = remappedNodeIds.get(nodeEntry.id)!
			const nodeParcel = nodes.get(nodeEntry.id)!

			const allLinks = selectedWires.filter((wire) => {
				return wire.sourceNode.id === nodeParcel.id || wire.targetNode.id === nodeParcel.id
			})

			const internalLinks = allLinks
				// Only take wires with this node as the source (avoids dupes)
				.filter((wire) => wire.sourceNode.id === nodeParcel.id)
				// Internal only, i.e. both ends are being copied
				.filter((wire) => remappedNodeIds.has(wire.sourceNode.id) && remappedNodeIds.has(wire.targetNode.id))

			const externalLinks = allLinks.filter((wire) => {
				return !remappedNodeIds.has(wire.sourceNode.id) || !remappedNodeIds.has(wire.targetNode.id)
			})

			const stateEntry: MindmapPasteData['nodes'][number] = {
				tempId: remappedNodeIds.get(nodeEntry.id)!,
				parentId: nodeParcel.parent.type === 'node' ? null : nodeParcel.parent.id,
				parentType: nodeParcel.parent.type,
				offsetX: Math.round(nodeParcel.node.positionX - geometricCenter.x),
				offsetY: Math.round(nodeParcel.node.positionY - geometricCenter.y),
				plainNodeName: nodeParcel.node.name,
			}

			structuredData.nodes.push(stateEntry)

			structuredData.internalLinks = structuredData.internalLinks.concat(
				internalLinks.flatMap((parcel) => ({
					sourceTempId: myTempId,
					targetTempId: remappedNodeIds.get(parcel.targetNode.id)!,
					direction: parcel.wire.direction,
					content: parcel.wire.content,
				})),
			)
			structuredData.externalLinks = structuredData.externalLinks.concat(
				externalLinks.flatMap((wireParcel) => ({
					sourceTempId: myTempId,
					targetNodeId:
						wireParcel.sourceNode.id === nodeParcel.id ? wireParcel.targetNode.id : wireParcel.sourceNode.id,
					direction: getWireDirection(nodeParcel, wireParcel),
					content: wireParcel.wire.content,
				})),
			)
		})
		return structuredData
	})

	const applyPasteData = useEvent(async (pasteData: MindmapPasteData) => {
		const worldPos = toWorkspaceCoords({
			screenX: mousePositionRef.current.x,
			screenY: mousePositionRef.current.y,
		})
		if (!worldPos) {
			throw new Error('Unable to get workspace coordinates')
		}

		const response = await pasteNodes({
			originX: worldPos.x,
			originY: worldPos.y,
			pasteData,
		})
		if (!response) {
			return
		}

		setNodeSelection(response.nodes.map((node) => node.id))
		setWireSelection(response.wires.map((wire) => wire.id))
	})

	return {
		createPasteData,
		applyPasteData,
		getCurrentSelection,
	}
}
