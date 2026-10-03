import { useLayoutEffect } from 'react'
import useEvent from 'react-use-event-hook'

import { MindmapNavigationState } from '../MindmapState'
import { useMindmapContext } from './useMindmapContext'

export function useMindmapPainter(painter: (navState: MindmapNavigationState) => void) {
	const { onPaint } = useMindmapContext()
	const paint = useEvent(painter)
	useLayoutEffect(() => onPaint(paint), [onPaint, paint])
}
