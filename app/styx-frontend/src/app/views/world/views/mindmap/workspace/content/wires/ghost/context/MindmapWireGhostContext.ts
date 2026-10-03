import { useState } from 'react'
import useEvent from 'react-use-event-hook'

import { createRealtimeContext } from '@/app/components/RealtimeContext'
import { MindmapNodeLayout } from '@/app/views/world/views/mindmap/types'

export type MindmapWireGhostFrame = {
	mouseX: number
	mouseY: number
	target: ({ id: string } & MindmapNodeLayout) | null
	wirePairs: Set<string>
}

export const MindmapWireGhostContext = createRealtimeContext(() => {
	const [painters] = useState(() => new Set<(frame: MindmapWireGhostFrame) => void>())

	const onPaint = useEvent((painter: (frame: MindmapWireGhostFrame) => void) => {
		painters.add(painter)
		return () => {
			painters.delete(painter)
		}
	})
	const paint = useEvent((frame: MindmapWireGhostFrame) => {
		for (const painter of painters) {
			painter(frame)
		}
	})

	return {
		onPaint,
		paint,
	}
})
