import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'

import { HomeSection } from './HomeSection'

type Props = {
	icon: ReactNode
	title: string
	cta: string
	description: string
	action?: ReactNode
}

export function HomeSectionEmptyState({ icon, title, cta, description, action }: Props) {
	const { palette } = useTheme()

	return (
		<HomeSection label={title} count={0}>
			<Stack direction="row" alignItems="center" gap={2} sx={{ p: 2 }}>
				<EntityInitialsTile name={cta} color={palette.primary.main} icon={icon} />
				<Stack flex={1} minWidth={0} gap={0.25}>
					<Typography variant="body1" fontWeight={600}>
						{cta}
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ textWrap: 'pretty' }}>
						{description}
					</Typography>
				</Stack>
				{action}
			</Stack>
		</HomeSection>
	)
}
