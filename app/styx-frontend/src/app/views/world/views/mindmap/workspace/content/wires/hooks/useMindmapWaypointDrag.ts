import useEvent from 'react-use-event-hook'

import { DragTrigger, matchesDragTrigger } from '@/app/features/dragDrop/DragTrigger'
import { usePointerCapture } from '@/app/hooks/usePointerCapture'
import { toWorkspaceCoords } from '@/app/views/world/views/mindmap/utils/toWorkspaceCoords'
import { Point } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'

type Props = {
	onStart: (point: Point) => void
	onMove: (point: Point) => void
	onEnd: (point: Point) => void
}

export function useMindmapWaypointDrag({ onStart, onMove, onEnd }: Props) {
	const { capture, release } = usePointerCapture()

	return useEvent((event: React.PointerEvent) => {
		if (!matchesDragTrigger(event.nativeEvent, DragTrigger.MoveElements)) {
			return
		}
		event.stopPropagation()

		const startClientX = event.clientX
		const startClientY = event.clientY
		const pointerId = event.pointerId
		let isDragging = false

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const point = toWorkspaceCoords({ screenX: moveEvent.clientX, screenY: moveEvent.clientY })
			if (!point) {
				return
			}
			if (!isDragging) {
				const offsetX = Math.abs(moveEvent.clientX - startClientX)
				const offsetY = Math.abs(moveEvent.clientY - startClientY)
				if (offsetX <= 3 && offsetY <= 3) {
					return
				}
				isDragging = true
				capture('grabbing', pointerId)
				onStart(point)
			}
			onMove(point)
		}

		const handlePointerUp = (upEvent: PointerEvent) => {
			window.removeEventListener('pointermove', handlePointerMove)
			window.removeEventListener('pointerup', handlePointerUp)
			if (!isDragging) {
				return
			}
			release()
			const point = toWorkspaceCoords({ screenX: upEvent.clientX, screenY: upEvent.clientY })
			if (point) {
				onEnd({ x: Math.round(point.x), y: Math.round(point.y) })
			}
		}

		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerup', handlePointerUp)
	})
}
