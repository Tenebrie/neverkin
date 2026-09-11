import Stack from '@mui/material/Stack'
import { ReactNode } from 'react'

import { HomeRowItemTimestamp } from './HomeRowItemTimestamp'

type Props = {
	updatedAt: string
	children: ReactNode
}

export function HomeRowItemActions({ updatedAt, children }: Props) {
	return (
		<Stack direction="row" alignItems="center" gap={1} sx={{ flex: '0 0 auto' }}>
			<HomeRowItemTimestamp updatedAt={updatedAt} />
			<Stack
				direction="row"
				gap={0.25}
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
			>
				{children}
			</Stack>
		</Stack>
	)
}
