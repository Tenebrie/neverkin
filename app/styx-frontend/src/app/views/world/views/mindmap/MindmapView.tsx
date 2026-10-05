import { MindmapContext } from './context/MindmapContext'
import { MindmapSelectionContext } from './context/MindmapSelectionContext'
import { Mindmap } from './Mindmap'

export function MindmapView() {
	return (
		<MindmapSelectionContext>
			<MindmapContext>
				<Mindmap />
			</MindmapContext>
		</MindmapSelectionContext>
	)
}
