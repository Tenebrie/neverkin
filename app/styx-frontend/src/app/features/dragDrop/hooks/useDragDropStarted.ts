import { useRef } from 'react'

import { DragDropStateType, IsDragDropStateOfType } from '../DragDropState'
import { AllowedDraggableType } from '../types'
import { useDragDropBusSubscribe } from './useDragDropBus'

type Props<T extends AllowedDraggableType> = {
	type: T
	callback: (state: DragDropStateType<T>) => void
}

export function useDragDropStarted<T extends AllowedDraggableType>({ type, callback }: Props<T>) {
	const isActive = useRef(false)

	useDragDropBusSubscribe({
		callback: (state) => {
			if (!IsDragDropStateOfType(state, type)) {
				isActive.current = false
				return
			}
			if (isActive.current) {
				return
			}
			isActive.current = true
			callback(state)
		},
	})
}
