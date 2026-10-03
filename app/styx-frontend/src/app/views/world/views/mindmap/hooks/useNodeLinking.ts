import { useCallback, useMemo } from 'react'
import { useStore } from 'react-redux'

import { mindmapApi } from '@/api/mindmapApi'
import { RootState } from '@/app/store'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

import { useMindmapContext } from '../context/useMindmapContext'

export function useNodeLinking() {
	const worldId = useCurrentWorldId()
	const store = useStore<MindmapApiState>()
	const { createWires, deleteWires } = useMindmapContext()

	const selectMindmapState = useMemo(() => mindmapApi.endpoints.getMindmap.select({ worldId }), [worldId])

	const getWires = useCallback(() => {
		const state = store.getState()
		return selectMindmapState(state).data?.wires
	}, [store, selectMindmapState])

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

	return {
		createLinks,
	}
}

type MindmapApiState = Parameters<ReturnType<typeof mindmapApi.endpoints.getMindmap.select>>[0] &
	Pick<RootState, 'world'>
