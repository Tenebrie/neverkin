import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import useEvent from 'react-use-event-hook'

import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'

import { getTransformAlign, GhostWrapper } from '../components/GhostWrapper'
import { DragTrigger, DragTriggerType, matchesDragTrigger } from '../DragTrigger'
import { AllowedDraggableType, DraggableParams } from '../types'
import { useDragDropBusSubscribe } from './useDragDropBus'
import { useDragDropState } from './useDragDropState'

type Props<T extends AllowedDraggableType> = {
	type: T
	params: DraggableParams[T]
	ghostAlign?: {
		top?: 'start' | 'center' | 'end'
		left?: 'start' | 'center' | 'end'
	}
	ghostFactory: (event: MouseEvent) => ReactNode
	adjustPosition?: (
		pos: { x: number; y: number },
		startingPos: { x: number; y: number },
	) => { x: number; y: number }
	trigger?: DragTriggerType
	disabled?: boolean
}

export const useDragDrop = <T extends AllowedDraggableType>({
	type,
	params,
	ghostAlign,
	ghostFactory,
	adjustPosition,
	trigger = DragTrigger.Default,
	disabled,
}: Props<T>) => {
	const isDraggingNow = useRef(false)
	const isPreparingToDrag = useRef(false)
	const rootPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const dragFromPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const [ghostElement, setGhostElement] = useState<ReactNode | null>(null)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const ghostWrapperRef = useRef<HTMLDivElement | null>(null)
	const lastMouseEventRef = useRef<MouseEvent | null>(null)

	// Store props in refs to keep callbacks stable across renders
	const paramsRef = useRef(params)
	paramsRef.current = params
	const ghostFactoryRef = useRef(ghostFactory)
	ghostFactoryRef.current = ghostFactory
	const adjustPositionRef = useRef(adjustPosition)
	adjustPositionRef.current = adjustPosition
	const ghostAlignRef = useRef(ghostAlign)
	ghostAlignRef.current = ghostAlign

	const { getState, setStateQuietly, setStateImmediately, clearState } = useDragDropState()

	const renderGhost = useCallback((event: MouseEvent) => {
		const align = {
			top: ghostAlignRef.current?.top ?? ('start' as const),
			left: ghostAlignRef.current?.left ?? ('start' as const),
		}
		setGhostElement(
			<GhostWrapper
				ref={ghostWrapperRef}
				initialLeft={rootPos.current.x}
				initialTop={rootPos.current.y}
				left={event.clientX}
				top={event.clientY}
				align={align}
			>
				{ghostFactoryRef.current(event)}
			</GhostWrapper>,
		)
	}, [])

	const onMouseDown = useEvent((event: MouseEvent) => {
		if (!containerRef.current || !matchesDragTrigger(event, trigger)) {
			return
		}
		isPreparingToDrag.current = true
		const boundingRect = containerRef.current.getBoundingClientRect()
		rootPos.current = {
			x: boundingRect.left,
			y: boundingRect.top,
		}
		dragFromPos.current = { x: event.clientX, y: event.clientY }
		attachWindowEvents()
	})

	const startDragging = useCallback(
		(event: MouseEvent) => {
			if (!containerRef.current) {
				return
			}
			isDraggingNow.current = true
			setStateImmediately({
				type,
				params: paramsRef.current,
				targetPos: { x: event.clientX, y: event.clientY },
				targetRootPos: { x: rootPos.current.x, y: rootPos.current.y },
				isHandled: false,
				hovered: [],
			})
			window.document.body.classList.add('cursor-grabbing', 'mouse-busy')
			renderGhost(event)
		},
		[setStateImmediately, type, renderGhost],
	)

	useDragDropBusSubscribe({
		callback: (data) => {
			if (!isDraggingNow.current || !lastMouseEventRef.current) {
				return
			}
			if (data?.type === type) {
				renderGhost(lastMouseEventRef.current)
			}
		},
	})

	const onMouseMove = useEvent((event: MouseEvent) => {
		lastMouseEventRef.current = event
		if (
			isPreparingToDrag.current &&
			(Math.abs(event.clientX - dragFromPos.current.x) > 3 ||
				Math.abs(event.clientY - dragFromPos.current.y) > 3)
		) {
			isPreparingToDrag.current = false
			startDragging(event)
		}
		if (!isDraggingNow.current) {
			return
		}

		const basePos = { x: event.clientX, y: event.clientY }
		const pos = adjustPositionRef.current ? adjustPositionRef.current(basePos, rootPos.current) : basePos
		setStateQuietly({
			...getState()!,
			targetPos: pos,
		})

		if (ghostWrapperRef.current) {
			const alignLeft = ghostAlignRef.current?.left ?? 'start'
			const alignTop = ghostAlignRef.current?.top ?? 'start'
			ghostWrapperRef.current.style.transform = `translate(${Math.round(pos.x)}px, ${Math.round(pos.y)}px) translate(${getTransformAlign(alignLeft)}, ${getTransformAlign(alignTop)})`
		}
	})

	const onMouseUp = useEvent(() => {
		detachWindowEvents()
		isPreparingToDrag.current = false
		if (!isDraggingNow.current) {
			return
		}
		isDraggingNow.current = false
		setGhostElement(null)
		clearState()
		setTimeout(() => {
			window.document.body.classList.remove('cursor-grabbing', 'mouse-busy')
		}, 1)
	})

	const onRightClick = useEvent((event: MouseEvent) => {
		if (!isDraggingNow.current) {
			return
		}
		onMouseUp()
		event.preventDefault()
	})

	const attachWindowEvents = useEvent(() => {
		window.addEventListener('contextmenu', onRightClick)
		window.addEventListener('mouseup', onMouseUp)
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('blur', onMouseUp)
	})

	const detachWindowEvents = useEvent(() => {
		window.removeEventListener('contextmenu', onRightClick)
		window.removeEventListener('mouseup', onMouseUp)
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('blur', onMouseUp)
	})

	useShortcut(
		Shortcut.Escape,
		() => {
			onMouseUp()
		},
		!!ghostElement,
	)

	const attachEvents = useCallback(() => {
		const container = containerRef.current
		if (!container || disabled) {
			return
		}

		container.addEventListener('mousedown', onMouseDown)

		return () => {
			container.removeEventListener('mousedown', onMouseDown)
		}
	}, [onMouseDown, disabled])

	useEffect(() => {
		return attachEvents()
	}, [attachEvents])

	useEffect(() => detachWindowEvents, [detachWindowEvents])

	return {
		ref: containerRef,
		isDragging: isDraggingNow.current,
		ghostElement,
		attachEvents,
	}
}
