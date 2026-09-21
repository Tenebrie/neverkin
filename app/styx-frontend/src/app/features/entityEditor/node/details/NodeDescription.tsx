import Box from '@mui/material/Box'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { RichTextEditorSummoner } from '@/app/features/richTextEditor/portals/RichTextEditorPortal'
import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'

type Props = {
	node: MindmapNode
	surface?: string
}

export const NodeDescription = ({ node, surface }: Props) => {
	const scrollbars = useBrowserSpecificScrollbars()

	return (
		<Box sx={{ ...scrollbars, height: '100%' }}>
			<RichTextEditorSummoner
				value={node.contentRich}
				onChange={() => {}}
				allowReadMode
				surface={surface}
				collaboration={{
					entityType: 'node',
					documentId: node.id,
				}}
			/>
		</Box>
	)
}
