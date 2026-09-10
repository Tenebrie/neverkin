import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'

type Props = {
	icon: ReactNode
	title: string
	description: string
	action?: ReactNode
}

export function HomeSectionEmptyState({ icon, title, description, action }: Props) {
	const { palette } = useTheme()

	return (
		<Stack direction="row" alignItems="center" gap={2} sx={{ p: 2 }}>
			<EntityInitialsTile name={title} color={palette.primary.main} icon={icon} />
			<Stack flex={1} minWidth={0} gap={0.25}>
				<Typography variant="body1" fontWeight={600}>
					{title}
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ textWrap: 'pretty' }}>
					{description}
				</Typography>
			</Stack>
			{action}
		</Stack>
	)
}
