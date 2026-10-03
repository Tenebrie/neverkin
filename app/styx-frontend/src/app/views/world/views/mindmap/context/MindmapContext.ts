import { useInsertionEffect, useState } from 'react'
import useEvent from 'react-use-event-hook'

import { createRealtimeContext } from '@/app/components/RealtimeContext'
import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'
import { SharedResizeObserver } from '@/app/utils/SharedResizeObserver'

import { useCreateMindmapWires } from '../api/useCreateMindmapWires'
import { useDeleteMindmapWires } from '../api/useDeleteMindmapWires'
import { useMoveMindmapNodes } from '../api/useMoveMindmapNodes'
import { useReparentMindmapNode } from '../api/useReparentMindmapNode'
import { MindmapNavigationState, MindmapState } from '../MindmapState'
import { MindmapNodeLayout, MindmapNodeParcel, MindmapWireParcel } from '../types'
import { WireControlPoints } from '../workspace/content/wires/canvas/MindmapCanvasMath'
import { MindmapWireBuffer } from '../workspace/content/wires/canvas/MindmapWireBuffer'

export const MindmapContext = createRealtimeContext(() => {
	const [painters] = useState(() => new Set<(navState: MindmapNavigationState) => void>())
	const [moveNodes] = useMoveMindmapNodes()
	const [reparentNode] = useReparentMindmapNode()
	const [createWires] = useCreateMindmapWires()
	const [deleteWires] = useDeleteMindmapWires()

	const onPaint = useEvent((painter: (navState: MindmapNavigationState) => void) => {
		painters.add(painter)
		return () => {
			painters.delete(painter)
		}
	})
	const paint = useEvent((navState: MindmapNavigationState) => {
		for (const painter of painters) {
			painter(navState)
		}
	})

	const [workspaceRect] = useState(() => new DOMRect())
	const updateWorkspaceRect = useEvent((rect: DOMRect) => {
		workspaceRect.x = rect.x
		workspaceRect.y = rect.y
		workspaceRect.width = rect.width
		workspaceRect.height = rect.height
	})

	useInsertionEffect(() => {
		MindmapState.workspaceRect = workspaceRect
		return () => {
			MindmapState.workspaceRect = null
		}
	})

	const [nodes] = useState(() => new ReactiveMap<string, MindmapNodeParcel>())
	const [nodeLayouts] = useState(() => new ReactiveMap<string, MindmapNodeLayout>())
	const [nodeResizeObserver] = useState(() => new SharedResizeObserver())
	const [wires] = useState(() => new ReactiveMap<string, MindmapWireParcel>())
	const [wireBuffer] = useState(() => new MindmapWireBuffer())
	const [wireGeometry] = useState(() => new Map<string, WireControlPoints>())

	return {
		nodes,
		nodeLayouts,
		nodeResizeObserver,
		wires,
		wireBuffer,
		wireGeometry,
		onPaint,
		paint,
		moveNodes,
		reparentNode,
		createWires,
		deleteWires,
		workspaceRect,
		updateWorkspaceRect,
	}
})
