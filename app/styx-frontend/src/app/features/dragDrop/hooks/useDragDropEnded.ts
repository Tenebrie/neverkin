import { useRef } from 'react'

import { IsDragDropStateOfType } from '../DragDropState'
import { AllowedDraggableType } from '../types'
import { useDragDropBusSubscribe } from './useDragDropBus'

type Props = {
	type: AllowedDraggableType
	callback: () => void
}

export function useDragDropEnded({ type, callback }: Props) {
	const isActive = useRef(false)

	useDragDropBusSubscribe({
		callback: (state) => {
			if (IsDragDropStateOfType(state, type)) {
				isActive.current = true
				return
			}
			if (!isActive.current) {
				return
			}
			isActive.current = false
			callback()
		},
	})
}
