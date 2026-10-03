import { useMindmapNodeIds } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { ActorNodePositioner } from '@/app/views/world/views/mindmap/unrefactored/ActorNodePositioner'

export function MindmapNodeLayer() {
	const nodeIds = useMindmapNodeIds()

	return (
		<>
			{nodeIds.map((nodeId) => (
				<ActorNodePositioner key={nodeId} nodeId={nodeId} />
			))}
		</>
	)
}
