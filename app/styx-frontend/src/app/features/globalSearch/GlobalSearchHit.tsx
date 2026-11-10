import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import { useCallback, useMemo } from 'react'

import { GlobalSearchHit as GlobalSearchHitData } from '@/api/types/searchTypes'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useColorUtils } from '@/app/utils/colors/useColorUtils'
import { ArticleListItemEndAdornment } from '@/app/views/world/views/wiki/articleList/ArticleListItemEndAdornment'
import { ArticleListItemIcon } from '@/app/views/world/views/wiki/articleList/icon/ArticleListItemIcon'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

type Props = {
	hit: GlobalSearchHitData
	onClose: () => void
}

export function GlobalSearchHit({ hit, onClose }: Props) {
	const navigate = useStableNavigate({})
	// const reveal = useRevealInMindmap(hit)

	const onNavigate = useCallback(() => {
		navigate({
			to: '/world/$worldId/wiki/$articleId',
			params: {
				worldId: hit.worldId,
				articleId: hit.id,
			},
		})
		onClose()
	}, [hit.id, hit.worldId, navigate, onClose])

	const theme = useCustomTheme()
	const { setOpacity } = useColorUtils()
	const entityColor = setOpacity(hit.color, 0.1)
	const entityColorHover = setOpacity(hit.color, 0.15)

	const isContextMenuOpen = false
	const tinted = false
	const renderHighlighted = false
	const isGrayscale = false
	const color = useMemo(() => {
		if (renderHighlighted && theme.mode === 'light') {
			return 'primary.contrastText'
		}
		return 'text.secondary'
	}, [renderHighlighted, theme.mode])

	return (
		<Box
			data-testid={`GlobalSearchHit/${hit.name}`}
			data-item-type={hit.type}
			sx={{
				pointerEvents: 'none',
			}}
		>
			<Stack
				direction="row"
				position="relative"
				sx={{
					pointerEvents: 'auto',
					'&:hover .context-menu-button': {
						opacity: 1,
					},
					'&:hover .end-adornment': {
						opacity: 0,
					},
				}}
			>
				<Button
					role="button"
					startIcon={
						<Stack direction="row" alignItems="center" sx={{ gap: 0.5, height: 28 }}>
							<ArticleListItemIcon article={hit} highlighted={renderHighlighted} folderCollapseIcon />
						</Stack>
					}
					variant={renderHighlighted ? 'contained' : 'text'}
					color="primary"
					onContextMenu={(event) => {
						event.preventDefault()
						// onContextMenu(article, event)
					}}
					sx={{
						background: tinted ? () => alpha(theme.material.palette.primary.main, 0.18) : undefined,
						'&:hover': {
							background: tinted ? () => alpha(theme.material.palette.primary.main, 0.26) : undefined,
						},
						'&::after': {
							content: '""',
							position: 'absolute',
							left: 0,
							right: 0,
							top: 'calc(-1 * var(--hit-gap))',
							bottom: 'calc(-1 * var(--hit-gap))',
						},
						paddingTop: 1,
						paddingBottom: 1,
						justifyContent: 'start',
						paddingLeft: 1.5,
						paddingRight: '8px',
						filter: isGrayscale ? 'grayscale(70%)' : 'none',
					}}
					fullWidth
					onClick={onNavigate}
				>
					<Stack direction="column" alignItems="flex-start" sx={{ width: '100%', minWidth: 0 }}>
						<Box
							sx={{
								lineHeight: '1.3rem',
								maxWidth: '100%',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{hit.name}
						</Box>
						{/* <ArticleListItemSecondary entity={hit} highlighted={renderHighlighted} /> */}
					</Stack>
					<Box
						className="end-adornment"
						sx={{ opacity: isContextMenuOpen ? 0 : 1, transition: 'opacity 0.15s' }}
					>
						<ArticleListItemEndAdornment article={hit} color={color} />
					</Box>
				</Button>
				{/* {!isReadOnly && (
					<ArticleListItemContextMenu
						article={article}
						color={color}
						onContextMenu={onContextMenu}
						isContextMenuOpen={isContextMenuOpen}
					/>
				)} */}
				{/* {ghostElement} */}
			</Stack>
		</Box>
	)
}
