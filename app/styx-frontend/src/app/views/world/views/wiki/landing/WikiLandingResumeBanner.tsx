import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { alpha, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { TruncatedTypography } from '@/app/components/TruncatedTypography'
import { useTimeAgo } from '@/app/hooks/useTimeAgo'
import { HomeRowItemTraitChip } from '@/app/views/home/components/rowItem/HomeRowItemTraitChip'

import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { ENTITY_TYPE_LABEL } from './utils/entityTypeLabel'
import { getEntityExcerpt } from './utils/getEntityExcerpt'

type Props = {
	entity: BoxedWikiEntity
	folderName: string | undefined
	openedAt: number
	onResume: () => void
}

export function WikiLandingResumeBanner({ entity, folderName, openedAt, onResume }: Props) {
	const { palette } = useTheme()
	const openedAgo = useTimeAgo(new Date(openedAt))
	const excerpt = getEntityExcerpt(entity)

	return (
		<Paper
			variant="outlined"
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 3,
				p: 2.5,
				borderRadius: 2,
				borderColor: alpha(palette.primary.main, 0.35),
				background: `linear-gradient(100deg, ${alpha(palette.primary.main, 0.13)}, transparent 70%), ${palette.background.paper}`,
			}}
		>
			<Stack flex={1} minWidth={0} gap={0.75}>
				<Stack
					direction="row"
					alignItems="center"
					gap={1}
					flexWrap="wrap"
					sx={{ typography: 'body2', color: 'text.secondary' }}
				>
					<HomeRowItemTraitChip label={ENTITY_TYPE_LABEL[entity.type]} accent />
					{folderName && (
						<>
							<span>·</span>
							<span>{folderName}</span>
						</>
					)}
					<span>·</span>
					<span>opened {openedAgo}</span>
				</Stack>
				<Typography component="h3" variant="h6" fontWeight={600} letterSpacing="-0.01em" noWrap>
					{entity.name}
				</Typography>
				{excerpt && (
					<TruncatedTypography
						$lines={2}
						variant="body2"
						color="text.secondary"
						sx={{ maxWidth: '62ch', textWrap: 'pretty' }}
					>
						{excerpt}
					</TruncatedTypography>
				)}
			</Stack>
			<Button variant="contained" startIcon={<PlayArrowIcon />} onClick={onResume} sx={{ flexShrink: 0 }}>
				Resume
			</Button>
		</Paper>
	)
}
