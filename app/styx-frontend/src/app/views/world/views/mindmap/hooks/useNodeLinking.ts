import { useCallback } from 'react'
import { useStore } from 'react-redux'

import { mindmapApi } from '@/api/mindmapApi'
import { RootState } from '@/app/store'

import { useCurrentWorldId } from '../../../hooks/useCurrentWorldId'
import { useMindmapContext } from '../context/useMindmapContext'

export function useNodeLinking() {
	const worldId = useCurrentWorldId()
	const store = useStore<MindmapApiState>()
	const { createWires, deleteWires } = useMindmapContext()

	const getWires = useCallback(() => {
		const state = store.getState()
		return mindmapApi.endpoints.getMindmap.select({ worldId })(state).data?.wires
	}, [store, worldId])

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
				deleteWires(existingLinks.map((link) => link.id))
				return
			}

			createWires(validPairs)
		},
		[createWires, deleteWires, getWires],
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
		createLinks,
		checkLinkExists,
	}
}

type MindmapApiState = Parameters<ReturnType<typeof mindmapApi.endpoints.getMindmap.select>>[0] &
	Pick<RootState, 'world'>
