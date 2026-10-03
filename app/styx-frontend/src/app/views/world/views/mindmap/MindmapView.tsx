import { MindmapContext } from './context/MindmapContext'
import { Mindmap } from './Mindmap'

export function MindmapView() {
	return (
		<MindmapContext>
			<Mindmap />
		</MindmapContext>
	)
}
