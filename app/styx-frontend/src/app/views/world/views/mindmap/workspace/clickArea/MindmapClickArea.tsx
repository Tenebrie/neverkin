import Box from '@mui/material/Box'
import { useRef } from 'react'

import { MindmapNodeDropTargetReporter } from './components/MindmapNodeDropTargetReporter'
import { useNewNodeReceiver } from './hooks/useNewNodeReceiver'
import { useWireDropReceiver } from './hooks/useWireDropReceiver'
import { MindmapSelectionBox } from './selection/MindmapSelectionBox'
import { MindmapSelectionReporter } from './selection/MindmapSelectionReporter'

export function MindmapClickArea() {
	const ref = useRef<HTMLDivElement>(null)
	useNewNodeReceiver({ ref })
	useWireDropReceiver({ ref })

	return (
		<>
			<Box
				data-mindmap-click-area
				ref={ref}
				sx={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
			></Box>
			<MindmapSelectionBox ref={ref} />
			<MindmapSelectionReporter />
			<MindmapNodeDropTargetReporter />
		</>
	)
}
