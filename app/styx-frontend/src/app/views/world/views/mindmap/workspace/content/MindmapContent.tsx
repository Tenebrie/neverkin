import Box from '@mui/material/Box'
import { ReactNode } from 'react'

import { WORKSPACE_SIZE } from '../MindmapWorkspace'

type Props = {
	children: ReactNode
}

export function MindmapContent({ children }: Props) {
	return (
		<Box
			sx={{
				position: 'absolute',
				left: WORKSPACE_SIZE / 2,
				top: WORKSPACE_SIZE / 2,
				zIndex: 1,
			}}
		>
			{children}
		</Box>
	)
}
