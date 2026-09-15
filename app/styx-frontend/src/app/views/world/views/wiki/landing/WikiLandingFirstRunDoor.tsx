import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'
import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

type Props = {
	type: 'actor' | 'event' | 'article'
	title: string
	body: string
	buttonLabel: string
	onClick: () => void
}

export function WikiLandingFirstRunDoor({ type, title, body, buttonLabel, onClick }: Props) {
	const { palette } = useTheme()

	return (
		<Paper
			component="article"
			variant="outlined"
			sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5, borderRadius: 2 }}
		>
			<Stack gap={1.5}>
				<Stack direction="row" alignItems="center" gap={1.5}>
					<EntityInitialsTile
						name={title}
						color={palette.primary.main}
						icon={<EntityIcon variant={type} />}
					/>
					<Typography variant="body1" fontWeight={600}>
						{title}
					</Typography>
				</Stack>
				<Typography variant="body2" color="text.secondary" sx={{ textWrap: 'pretty' }}>
					{body}
				</Typography>
			</Stack>
			<Button
				variant="outlined"
				color="secondary"
				endIcon={<ChevronRightIcon />}
				onClick={onClick}
				sx={{ alignSelf: 'flex-start', mt: 'auto' }}
			>
				{buttonLabel}
			</Button>
		</Paper>
	)
}
