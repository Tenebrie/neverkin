import { useRealtimeContext } from '@/app/components/RealtimeContext/useRealtimeContext'
import { useReactiveMapKeys, useReactiveMapValue } from '@/app/features/reactivity/useReactiveMap'

import { MindmapContext } from './MindmapContext'
import { MindmapSelectionContext } from './MindmapSelectionContext'

export function useMindmapContext() {
	return useRealtimeContext(MindmapContext)
}

export function useMindmapSelectionContext() {
	return useRealtimeContext(MindmapSelectionContext)
}

export function useMindmapNode(id: string) {
	const { nodes } = useMindmapContext()
	return useReactiveMapValue(nodes, id)
}

export function useMindmapWire(id: string) {
	const { wires } = useMindmapContext()
	return useReactiveMapValue(wires, id)
}

export function useMindmapNodeIds() {
	const { nodes } = useMindmapContext()
	return useReactiveMapKeys(nodes)
}

export function useMindmapWireIds() {
	const { wires } = useMindmapContext()
	return useReactiveMapKeys(wires)
}
