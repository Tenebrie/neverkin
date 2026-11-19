import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import {
	useMindmapContext,
	useMindmapSelectionContext,
} from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { toWorkspaceCoords } from '@/app/views/world/views/mindmap/utils/toWorkspaceCoords'
import {
	collectMergeTargets,
	snapToMergeTarget,
} from '@/app/views/world/views/mindmap/utils/waypointMergeSnap'
import {
	nearestWirePoint,
	Point,
} from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'
import { WirePaint } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapWireBuffer'
import { useMindmapWaypointDrag } from '@/app/views/world/views/mindmap/workspace/content/wires/hooks/useMindmapWaypointDrag'

type Props = {
	wireId: string
	paint: WirePaint
	onOpenPopover: (params: {
		wireId: string
		position: { x: number; y: number }
		mode: 'doubleClick' | 'contextMenu'
	}) => void
}

export function useMindmapWireInteraction({ wireId, paint, onOpenPopover }: Props) {
	const { wireBuffer, wireGeometry, wires, createWaypoints } = useMindmapContext()
	const {
		selectedWires,
		addWireToSelection,
		removeWireFromSelection,
		addWireToHover,
		removeWireFromHover,
		hasBulkSelection,
	} = useMindmapSelectionContext()

	const isHoveredRef = useRef(false)
	const isActiveRef = useRef(false)
	const selectedRef = useRef(false)

	const applyVisualState = useCallback(() => {
		const isSel = selectedRef.current
		const isHov = isHoveredRef.current
		const isAct = isActiveRef.current

		paint.glowOpacity = isSel ? 0.7 : isHov || isAct ? 0.4 : 0.12
		paint.isActive = isAct
		wireBuffer.publish(wireId, paint)
	}, [paint, wireId, wireBuffer])

	useLayoutEffect(() => {
		if (selectedWires.has(wireId)) {
			selectedRef.current = true
			applyVisualState()
		}
		return selectedWires.subscribe(wireId, () => {
			selectedRef.current = selectedWires.has(wireId)
			applyVisualState()
		})
	}, [applyVisualState, selectedWires, wireId])

	const editedWireIds = () => new Set(selectedRef.current ? selectedWires.keys() : [wireId])

	const createWaypointAt = (point: Point) => {
		createWaypoints({
			targets: [...editedWireIds()].map((id) => ({
				wireId: id,
				index: nearestWirePoint(wireGeometry.get(id) ?? [], point).index,
			})),
			positionX: Math.round(point.x),
			positionY: Math.round(point.y),
		})
	}

	const preview = useRef({ wireIds: new Set<string>(), mergeTargets: [] as Point[] })
	const onPointerDown = useMindmapWaypointDrag({
		onStart: (point) => {
			preview.current = { wireIds: editedWireIds(), mergeTargets: collectMergeTargets(wires, new Set()) }
			dispatchGlobalEvent['mindmap/wire/onWaypointPreviewStart']({
				wireIds: preview.current.wireIds,
				position: point,
			})
		},
		onMove: (point) => {
			dispatchGlobalEvent['mindmap/wire/onWaypointPreviewMove']({
				wireIds: preview.current.wireIds,
				position: snapToMergeTarget(point, preview.current.mergeTargets),
			})
		},
		onEnd: (point) => {
			const snapped = snapToMergeTarget(point, preview.current.mergeTargets)
			dispatchGlobalEvent['mindmap/wire/onWaypointPreviewMove']({
				wireIds: preview.current.wireIds,
				position: snapped,
			})
			createWaypointAt(snapped)
		},
	})

	const { triggerClick, startLongClick, cancelLongClick } = useDoubleClick<{
		multiselect: boolean
		event: React.MouseEvent
	}>({
		onClick: ({ multiselect }) => {
			if (selectedRef.current) {
				removeWireFromSelection(wireId)
			} else {
				addWireToSelection({ wireId, multiselect })
			}
		},
		onDoubleClick: ({ event, multiselect }) => {
			const clicked = toWorkspaceCoords({ screenX: event.clientX, screenY: event.clientY })
			if (!clicked) {
				return
			}
			addWireToSelection({ wireId, multiselect: true })
			createWaypointAt(nearestWirePoint(wireGeometry.get(wireId) ?? [], clicked).point)
			if (!multiselect && !hasBulkSelection()) {
				removeWireFromSelection(wireId)
			}
		},
		onLongClick: ({ event }) => {
			addWireToSelection({ wireId, multiselect: false })
			onOpenPopover({ wireId, position: { x: event.clientX, y: event.clientY }, mode: 'doubleClick' })
		},
		ignoreDelay: true,
	})

	const { onMouseDown, onMouseUp } = useDraggableClick({
		onRightClick: (event) => {
			const isBulkSelectContext = hasBulkSelection() && selectedRef.current
			if (isBulkSelectContext) {
				dispatchGlobalEvent['mindmap/bulk/requestOpenContextMenu']({
					position: { x: event.clientX, y: event.clientY },
				})
			} else {
				addWireToSelection({ wireId, multiselect: false })
				onOpenPopover({ wireId, position: { x: event.clientX, y: event.clientY }, mode: 'contextMenu' })
			}
		},
	})

	const clickArgs = (event: React.MouseEvent) => ({
		multiselect: isMultiselectEvent(event),
		event,
	})
	const onClick = (event: React.MouseEvent) => triggerClick(event, clickArgs(event))
	const onPressStart = (event: React.MouseEvent) => {
		onMouseDown()
		startLongClick(event, clickArgs(event))
	}
	const onPressEnd = (event: React.MouseEvent) => {
		onMouseUp(event)
		cancelLongClick()
	}

	const pathProps = {
		onClick,
		onPointerDown,
		onMouseEnter: () => {
			isHoveredRef.current = true
			addWireToHover(wireId)
			applyVisualState()
		},
		onMouseLeave: () => {
			isHoveredRef.current = false
			isActiveRef.current = false
			removeWireFromHover(wireId)
			applyVisualState()
			cancelLongClick()
		},
		onMouseDown: (event: React.MouseEvent) => {
			isActiveRef.current = true
			applyVisualState()
			onPressStart(event)
		},
		onMouseUp: (event: React.MouseEvent) => {
			isActiveRef.current = false
			applyVisualState()
			onPressEnd(event)
		},
	}

	useEffect(
		() => () => {
			removeWireFromHover(wireId)
		},
		[removeWireFromHover, wireId],
	)

	const labelProps = { onClick, onMouseDown: onPressStart, onMouseUp: onPressEnd }

	return { pathProps, labelProps }
}
