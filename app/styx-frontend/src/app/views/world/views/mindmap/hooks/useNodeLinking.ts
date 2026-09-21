import { useCallback } from 'react'
import { useSelector, useStore } from 'react-redux'

import { mindmapApi } from '@/api/mindmapApi'

import { getWorldIdState } from '../../../WorldSliceSelectors'
import { useCreateMindmapWires } from '../api/useCreateMindmapWires'
import { useDeleteMindmapWires } from '../api/useDeleteMindmapWires'

export function useNodeLinking() {
	const worldId = useSelector(getWorldIdState)
	const store = useStore<MindmapApiState>()

	const [createMindmapWires] = useCreateMindmapWires()
	const [deleteMindmapWires] = useDeleteMindmapWires()

	const getWires = useCallback(
		() => mindmapApi.endpoints.getMindmap.select({ worldId })(store.getState()).data?.wires,
		[store, worldId],
	)

	const createLink = useCallback(
		({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
			const wires = getWires()
			if (!wires) {
				return
			}

			const existingLink = wires.find(
				(link) =>
					(link.sourceNodeId === sourceId && link.targetNodeId === targetId) ||
					(link.sourceNodeId === targetId && link.targetNodeId === sourceId),
			)
			if (existingLink) {
				return deleteMindmapWires([existingLink.id])
			}
			const newLink = createMindmapWires([
				{
					sourceNodeId: sourceId,
					targetNodeId: targetId,
				},
			])
			return newLink
		},
		[createMindmapWires, deleteMindmapWires, getWires],
	)

	const createLinks = useCallback(
		(newPairs: { sourceNodeId: string; targetNodeId: string }[]) => {
			const wires = getWires()
			if (!wires) {
				return
			}

			const validPairs = newPairs.filter(({ sourceNodeId, targetNodeId }) => sourceNodeId !== targetNodeId)

			const existingLinks = validPairs
				.map(({ sourceNodeId, targetNodeId }) =>
					wires.find((link) => {
						const isMatching =
							link.sourceNodeId === sourceNodeId &&
							link.targetNodeId === targetNodeId &&
							link.direction === 'Normal'
						const isReversedMatching =
							link.sourceNodeId === targetNodeId &&
							link.targetNodeId === sourceNodeId &&
							link.direction === 'Reversed'
						return isMatching || isReversedMatching
					}),
				)
				.filter((link): link is NonNullable<typeof link> => !!link)

			if (existingLinks.length === validPairs.length) {
				return deleteMindmapWires(existingLinks.map((link) => link.id))
			}

			return createMindmapWires(validPairs)
		},
		[createMindmapWires, deleteMindmapWires, getWires],
	)

	const checkLinkExists = useCallback(
		(sourceNodeId: string, targetNodeId: string) => {
			const wires = getWires()
			if (!wires) {
				return false
			}

			return wires.some(
				(link) =>
					(link.sourceNodeId === sourceNodeId && link.targetNodeId === targetNodeId) ||
					(link.sourceNodeId === targetNodeId && link.targetNodeId === sourceNodeId),
			)
		},
		[getWires],
	)

	return {
		createLink,
		createLinks,
		checkLinkExists,
	}
}

/**
 * `combineReducers` erases the tag types the mindmap endpoints inject, so the app-wide RootState
 * does not line up with what a generated endpoint selector expects. Take the shape from the
 * selector itself.
 */
type MindmapApiState = Parameters<ReturnType<typeof mindmapApi.endpoints.getMindmap.select>>[0]
