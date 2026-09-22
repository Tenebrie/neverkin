import Hub from '@mui/icons-material/Hub'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useGetMindmapQuery } from '@/api/mindmapApi'
import { useStrictParams } from '@/router-utils/hooks/useStrictParams'

export function MindmapEmptyState() {
	const { worldId } = useStrictParams({ from: '/world/$worldId/_world' })
	const { data } = useGetMindmapQuery({ worldId }, { skip: !worldId })

	if (!data || data.nodes.length > 0) {
		return null
	}

	return (
		<Stack
			alignItems="center"
			justifyContent="center"
			gap={1}
			sx={{
				position: 'absolute',
				inset: 0,
				color: 'text.disabled',
				textAlign: 'center',
				userSelect: 'none',
			}}
		>
			<Hub sx={{ fontSize: 48 }} />
			<Typography variant="h6">The mindmap is empty!</Typography>
			<Typography variant="body2">
				Drag something in from the sidebar, or right click here to add a node.
			</Typography>
		</Stack>
	)
}
