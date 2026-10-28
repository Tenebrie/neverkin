import { MindmapContext } from './context/MindmapContext'
import { MindmapSelectionContext } from './context/MindmapSelectionContext'
import { Mindmap } from './Mindmap'

export function MindmapView() {
	return (
		<MindmapSelectionContext.Provider>
			<MindmapContext.Provider>
				<Mindmap />
			</MindmapContext.Provider>
		</MindmapSelectionContext.Provider>
	)
}
