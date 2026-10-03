import { useMindmapNodeIds } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapNode } from '@/app/views/world/views/mindmap/workspace/content/nodes/MindmapNode'

export function MindmapNodeLayer() {
	const nodeIds = useMindmapNodeIds()

	return (
		<>
			{nodeIds.map((nodeId) => (
				<MindmapNode key={nodeId} nodeId={nodeId} />
			))}
		</>
	)
}
