import { RefObject, useEffect, useLayoutEffect } from 'react'
import useEvent from 'react-use-event-hook'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useAutoRef } from '@/app/hooks/useAutoRef'
import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'

import { getNodeLayout } from '../../wires/utils/getNodeLayout'

export function useMindmapNodeLayout(node: MindmapNode, ref: RefObject<HTMLDivElement | null>) {
	const { nodeLayouts, nodeResizeObserver } = useMindmapContext()
	const nodeRef = useAutoRef(node)

	const moveTo = useEvent((x: number, y: number) => {
		ref.current?.style.setProperty('--node-x', `${x}px`)
		ref.current?.style.setProperty('--node-y', `${y}px`)

		const current = nodeLayouts.get(node.id)
		if (current && current.x === x && current.y === y) {
			return
		}
		nodeLayouts.set(node.id, { ...getNodeLayout(nodeLayouts, node), x, y })
	})

	useLayoutEffect(() => {
		moveTo(node.positionX, node.positionY)
	}, [node, moveTo])

	useLayoutEffect(() => {
		const element = ref.current
		if (!element) {
			return
		}
		return nodeResizeObserver.observe(element, (entry) => {
			const { x, y } = getNodeLayout(nodeLayouts, nodeRef.current)
			const { inlineSize, blockSize } = entry.borderBoxSize[0]
			nodeLayouts.set(nodeRef.current.id, { x, y, width: inlineSize, height: blockSize })
		})
	}, [nodeLayouts, nodeResizeObserver, nodeRef, ref])

	useEffect(
		() => () => {
			nodeLayouts.delete(node.id)
		},
		[node.id, nodeLayouts],
	)

	return { moveTo }
}
