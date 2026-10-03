import Stack from '@mui/material/Stack'

import { MindmapBulkContextMenu } from './components/MindmapBulkContextMenu'
import { MindmapHotkeys } from './components/MindmapHotkeys'
import { MindmapNodeContextMenu } from './components/MindmapNodeContextMenu'
import { MindmapQuickSelect } from './components/MindmapQuickSelect'
import { MindmapScaleReporter } from './components/MindmapScaleReporter'
import { MindmapBackground } from './screenspace/MindmapBackground'
import { MindmapEmptyState } from './screenspace/MindmapEmptyState'
import { MindmapClickArea } from './workspace/clickArea/MindmapClickArea'
import { MindmapContent } from './workspace/content/MindmapContent'
import { MindmapContentManager } from './workspace/content/MindmapContentManager'
import { MindmapNodeLayer } from './workspace/content/nodes/MindmapNodeLayer'
import { MindmapWireCanvas } from './workspace/content/wires/canvas/MindmapCanvas'
import { MindmapWireLayer } from './workspace/content/wires/MindmapWireLayer'
import { MindmapWorkspace } from './workspace/MindmapWorkspace'

export function Mindmap() {
	return (
		<Stack sx={{ width: '100%', height: '100%', position: 'relative' }}>
			{/* Screen-space */}
			<MindmapBackground />
			<MindmapWireCanvas />
			<MindmapEmptyState />

			{/* Scrollable container */}
			<MindmapWorkspace>
				<MindmapClickArea />
				<MindmapContent>
					<MindmapContentManager />
					<MindmapNodeLayer />
					<MindmapWireLayer />
				</MindmapContent>
			</MindmapWorkspace>

			{/* Utilities */}
			<MindmapScaleReporter />
			<MindmapHotkeys />
			<MindmapQuickSelect />
			<MindmapNodeContextMenu />
			<MindmapBulkContextMenu />
		</Stack>
	)
}
