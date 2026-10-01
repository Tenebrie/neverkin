import { useLayoutEffect } from 'react'
import useEvent from 'react-use-event-hook'

import { useRealtimeContext } from '@/app/components/RealtimeContext'

import { MindmapWireGhostContext, MindmapWireGhostFrame } from './MindmapWireGhostContext'

export function useMindmapWireGhostContext() {
	return useRealtimeContext(MindmapWireGhostContext)
}

export function useMindmapWireGhostPainter(painter: (frame: MindmapWireGhostFrame) => void) {
	const { onPaint } = useMindmapWireGhostContext()
	const paint = useEvent(painter)
	useLayoutEffect(() => onPaint(paint), [onPaint, paint])
}
