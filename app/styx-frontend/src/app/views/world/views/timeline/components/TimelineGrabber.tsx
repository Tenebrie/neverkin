import { memo, useEffect, useRef, useState } from 'react'
import { MouseEvent as ReactMouseEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { preferencesSlice } from '@/app/features/preferences/PreferencesSlice'
import { getTimelinePreferences } from '@/app/features/preferences/PreferencesSliceSelectors'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'

const StyledDragger = styled.div`
	width: 100%;
	height: 8px;
	position: absolute;
	top: -4px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: ns-resize;
`

const TimelineGrabberComponent = () => {
	const isDraggingNow = useRef(false)
	const [mousePosition, setMousePosition] = useState(0)
	const mouseStartingPosition = useRef(0)

	const onMouseDown = (event: ReactMouseEvent) => {
		isDraggingNow.current = true
		mouseStartingPosition.current = event.clientY
		window.document.body.classList.add('cursor-resizing-ns', 'mouse-busy')
	}

	useEffectOnce(() => {
		const onMouseUp = () => {
			if (isDraggingNow.current) {
				isDraggingNow.current = false
				setTimeout(() => {
					window.document.body.classList.remove('cursor-resizing-ns', 'mouse-busy')
				}, 1)
			}
		}
		const onMouseMove = (event: MouseEvent) => {
			if (isDraggingNow.current) {
				setMousePosition(event.clientY)
			}
		}

		window.addEventListener('mouseup', onMouseUp)
		window.addEventListener('mousemove', onMouseMove)

		return () => {
			window.removeEventListener('mouseup', onMouseUp)
			window.removeEventListener('mousemove', onMouseMove)
		}
	})

	const { containerHeight } = useSelector(getTimelinePreferences)
	const { setTimelineHeight } = preferencesSlice.actions
	const dispatch = useDispatch()

	const currentContainerHeight = useRef(containerHeight)

	useEffect(() => {
		currentContainerHeight.current = containerHeight
	}, [containerHeight])

	useEffect(() => {
		if (isDraggingNow.current && mousePosition !== 0) {
			setMousePosition(0)
			const safeValue = (() => {
				const value = currentContainerHeight.current - mousePosition + mouseStartingPosition.current
				if (value < 232) {
					return 232
				}
				if (value > 800) {
					return 800
				}
				return value
			})()
			dispatch(setTimelineHeight(safeValue))
			mouseStartingPosition.current = mousePosition
		}
	}, [dispatch, mousePosition, setTimelineHeight])

	return <StyledDragger onMouseDown={(event) => onMouseDown(event)}></StyledDragger>
}

export const TimelineGrabber = memo(TimelineGrabberComponent)
