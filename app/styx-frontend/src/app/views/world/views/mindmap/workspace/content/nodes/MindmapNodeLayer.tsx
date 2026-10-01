import { useMindmapNodeIds } from '../../../context/useMindmapContext'
import { ActorNodePositioner } from '../../../unrefactored/ActorNodePositioner'

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
