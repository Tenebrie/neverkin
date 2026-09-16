import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { alpha, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import { TruncatedTypography } from '@/app/components/TruncatedTypography'
import { useTimeAgo } from '@/app/hooks/useTimeAgo'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { getWikiState } from '../WikiSliceSelectors'
import { getEntityExcerpt } from './utils/getEntityExcerpt'

type Props = {
	entity: BoxedWikiEntity
	openedAt: number
}

export function WikiLandingResumeBanner({ entity, openedAt }: Props) {
	const { folders } = useSelector(getWikiState, (a, b) => a.folders === b.folders)
	const { palette } = useTheme()
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const openedAgo = useTimeAgo(new Date(openedAt))
	const excerpt = getEntityExcerpt(entity)
	const folderName = folders.find((folder) => folder.id === entity.entity.parentFolderId)?.name

	const open = () =>
		navigate({ to: '/world/$worldId/wiki/$articleId', params: { articleId: entity.id }, search: true })

	return (
		<ButtonBase
			component={Paper}
			variant="outlined"
			aria-label={`Resume "${entity.name}"`}
			onClick={open}
			sx={{
				display: 'flex',
				alignItems: 'center',
				textAlign: 'left',
				width: '100%',
				gap: 3,
				p: 2.5,
				borderRadius: 2,
				border: '1px solid',
				borderColor: alpha(palette.primary.main, 0.35),
				background: `linear-gradient(100deg, ${alpha(palette.primary.main, 0.13)}, transparent 70%), ${palette.background.paper}`,
				transition: 'border-color 0.16s',
				'&:hover:not(:has(.MuiButton-root:hover)), &.Mui-focusVisible': {
					borderColor: alpha(palette.primary.main, 0.7),
				},
			}}
		>
			<Stack flex={1} minWidth={0} gap={0.75}>
				<Stack
					direction="row"
					alignItems="center"
					gap={1}
					flexWrap="wrap"
					sx={{ typography: 'caption', color: 'text.secondary' }}
				>
					<Box
						sx={{
							px: 0.875,
							py: 0.25,
							borderRadius: 0.75,
							bgcolor: alpha(palette.primary.main, 0.2),
							color: 'primary.light',
							fontSize: 11,
							fontWeight: 700,
							letterSpacing: '0.08em',
							textTransform: 'uppercase',
						}}
					>
						{entity.type}
					</Box>
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
			<Button
				variant="contained"
				startIcon={<PlayArrowIcon />}
				onClick={(event) => {
					event.stopPropagation()
					open()
				}}
				onMouseDown={(event) => event.stopPropagation()}
				sx={{ flexShrink: 0 }}
			>
				Resume
			</Button>
		</ButtonBase>
	)
}
