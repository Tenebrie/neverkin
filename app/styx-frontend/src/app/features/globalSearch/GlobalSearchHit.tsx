import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo } from 'react'

import { GlobalSearchEntry } from '@/api/types/searchTypes'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'
import { useColorUtils } from '@/app/utils/colors/useColorUtils'
import { formatTimeAgo } from '@/app/utils/formatTimeAgo'
import { ArticleListItemIcon } from '@/app/views/world/views/wiki/articleList/icon/ArticleListItemIcon'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import { HighlightedText } from '@/ui-lib/components/HighlightedText/HighlightedText'

const SNIPPET_LEAD = 30

const captionLineStyles = {
	display: 'block',
	maxWidth: '100%',
	fontWeight: 400,
	lineHeight: '1.1rem',
	textOverflow: 'ellipsis',
	overflow: 'clip',
	overflowClipMargin: '2px',
	whiteSpace: 'nowrap',
}

type Props = {
	hit: GlobalSearchEntry
	query: string
	onClose: () => void
}

export function GlobalSearchHit({ hit, query, onClose }: Props) {
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
	const { adaptColor, setOpacity } = useColorUtils()
	const entityColor = setOpacity(hit.color, 0.1)
	const entityColorHover = setOpacity(hit.color, 0.15)
	const typeColor = adaptColor(hit.color || getAccentColor(hit.id), theme.material.palette.background.paper)

	const tinted = false
	const renderHighlighted = false
	const isGrayscale = false
	const color = useMemo(() => {
		if (renderHighlighted && theme.mode === 'light') {
			return 'primary.contrastText'
		}
		return 'text.disabled'
	}, [renderHighlighted, theme.mode])

	const nameMatched = hit.name.toLowerCase().includes(query.toLowerCase())
	const contentMatchStart = hit.content.toLowerCase().indexOf(query.toLowerCase())
	let snippet: string | null = null
	if (!nameMatched && contentMatchStart !== -1) {
		const lineStart = hit.content.lastIndexOf('\n', contentMatchStart) + 1
		let lineEnd = hit.content.indexOf('\n', contentMatchStart)
		if (lineEnd === -1) {
			lineEnd = hit.content.length
		}
		const snippetStart = Math.max(lineStart, contentMatchStart - SNIPPET_LEAD)
		snippet = (snippetStart > lineStart ? '…' : '') + hit.content.slice(snippetStart, lineEnd)
	}

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
						<Stack direction="row" alignItems="center" sx={{ gap: 0.5, height: 32 }}>
							<ArticleListItemIcon article={hit} highlighted={renderHighlighted} folderCollapseIcon />
						</Stack>
					}
					variant={renderHighlighted ? 'contained' : 'text'}
					color="inherit"
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
						paddingTop: '9px',
						paddingBottom: '9px',
						justifyContent: 'start',
						paddingLeft: '11px',
						paddingRight: '11px',
						filter: isGrayscale ? 'grayscale(70%)' : 'none',
					}}
					fullWidth
					onClick={onNavigate}
				>
					<Stack direction="column" alignItems="flex-start" sx={{ width: '100%', minWidth: 0 }}>
						<Typography
							variant="caption"
							sx={{
								...captionLineStyles,
								color: typeColor,
								fontSize: '0.65rem',
								fontWeight: 700,
								letterSpacing: '0.1em',
								textTransform: 'uppercase',
							}}
						>
							{hit.pageId ? 'page' : hit.type}
						</Typography>
						<Box
							sx={{
								lineHeight: '1.3rem',
								maxWidth: '100%',
								overflow: 'clip',
								overflowClipMargin: '2px',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							<HighlightedText text={hit.name} query={query} />
							{hit.title && (
								<>
									{', '}
									<HighlightedText text={hit.title} query={query} />
								</>
							)}
						</Box>
						{snippet && (
							<Typography variant="caption" sx={{ ...captionLineStyles, color: 'text.secondary' }}>
								<HighlightedText text={snippet} query={query} />
							</Typography>
						)}
					</Stack>
					<Typography variant="caption" sx={{ color, whiteSpace: 'nowrap', marginLeft: 1 }}>
						{formatTimeAgo(new Date(hit.updatedAt))}
					</Typography>
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
