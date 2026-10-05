import { MindmapWire } from '@/api/types/mindmapTypes'

import { MindmapNodeParcel, MindmapWireParcel } from '../types'

export function getWireDirection(
	from: MindmapNodeParcel,
	wireParcel: MindmapWireParcel,
): MindmapWire['direction'] {
	if (wireParcel.wire.direction === 'TwoWay') {
		return 'TwoWay'
	}

	if (wireParcel.sourceNode.id === from.id) {
		return wireParcel.wire.direction
	} else if (wireParcel.wire.direction === 'Normal') {
		return 'Reversed'
	} else {
		return 'Normal'
	}
}
