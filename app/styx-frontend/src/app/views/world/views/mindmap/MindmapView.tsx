import Box from '@mui/material/Box'

import { Mindmap } from './Mindmap'

export const MindmapView = () => {
	return (
		<Box width={1} height={1} position="relative" overflow="auto">
			<Mindmap />
		</Box>
	)
}
