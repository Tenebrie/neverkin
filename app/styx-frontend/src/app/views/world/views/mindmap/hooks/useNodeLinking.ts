import { useCallback } from 'react'
import { useStore } from 'react-redux'

import { mindmapApi } from '@/api/mindmapApi'
import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { RootState } from '@/app/store'

export function useNodeLinking() {
	const store = useStore<MindmapApiState>()

	const getWires = useCallback(() => {
		const state = store.getState()
		return mindmapApi.endpoints.getMindmap.select({ worldId: state.world.id })(state).data?.wires
	}, [store])

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
				dispatchGlobalEvent['mindmap/wire/requestDelete']({
					wireIds: existingLinks.map((link) => link.id),
				})
				return
			}

			dispatchGlobalEvent['mindmap/wire/requestCreate']({ wires: validPairs })
		},
		[getWires],
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
