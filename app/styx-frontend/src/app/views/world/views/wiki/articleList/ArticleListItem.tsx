import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import { useMatches } from '@tanstack/react-router'
import { memo, MouseEvent, useCallback, useMemo } from 'react'

import { DragDropState } from '@/app/features/dragDrop/DragDropState'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useColorUtils } from '@/app/utils/colors/useColorUtils'
import { useIsMindmapView } from '@/app/views/world/hooks/useIsMindmapView'
import { useIsReadOnly } from '@/app/views/world/hooks/useIsReadOnly'
import { useRevealInMindmap } from '@/app/views/world/views/mindmap/hooks/useRevealInMindmap'
import { useArticleDragDrop } from '@/app/views/world/views/wiki/hooks/useArticleDragDrop'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { useArticleBulkActions } from '../hooks/useArticleBulkActions'
import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { ArticleList } from './ArticleList'
import { ArticleListItemContextMenu } from './ArticleListItemContextMenu'
import { ArticleListItemEndAdornment } from './ArticleListItemEndAdornment'
import { ArticleListItemSecondary } from './ArticleListItemSecondary'
import { useArticleCollapseControls } from './hooks/useArticleCollapseControls'
import { useIsFolderGrayedOut } from './hooks/useIsFolderGrayedOut'
import { ArticleListItemIcon } from './icon/ArticleListItemIcon'

type Props = {
	article: BoxedWikiEntity
	depth: number
	onContextMenu: (article: BoxedWikiEntity, event: React.MouseEvent) => void
	isContextMenuOpen: boolean
}

export const ArticleListItem = memo(ArticleListItemComponent)

function ArticleListItemComponent({ article, ...props }: Props) {
	const { toggleOpen, collapsed } = useArticleCollapseControls(article)

	const matches = useMatches()
	const highlighted = matches.some(
		(match) =>
			match.routeId === '/world/$worldId/_world/wiki/_wiki/$articleId' &&
			match.params.articleId === article.id,
	)
	const isMindmapView = useIsMindmapView()

	return (
		<ArticleListItemInner
			article={article}
			expanded={!collapsed}
			toggleOpen={toggleOpen}
			highlighted={highlighted}
			isMindmapView={isMindmapView}
			{...props}
		/>
	)
}

export const ArticleListItemInner = memo(ArticleListItemInnerComponent)

function ArticleListItemInnerComponent({
	article,
	depth,
	expanded,
	toggleOpen,
	highlighted,
	isMindmapView,
	onContextMenu,
	isContextMenuOpen,
}: Props & { expanded: boolean; toggleOpen: () => void; highlighted: boolean; isMindmapView: boolean }) {
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const reveal = useRevealInMindmap(article)

	const { isReadOnly } = useIsReadOnly()
	const { isBulkSelecting, checked, onRowToggle, onShiftSelect } = useArticleBulkActions(article)
	const renderHighlighted = !isBulkSelecting && highlighted
	const tinted = isBulkSelecting && checked && !renderHighlighted

	const onNavigate = useCallback(
		(event: MouseEvent) => {
			if (DragDropState.current) {
				return
			}
			if (isBulkSelecting) {
				onRowToggle(event)
				return
			}

			if (event.shiftKey) {
				onShiftSelect()
				return
			}

			if (event.metaKey || event.ctrlKey) {
				onRowToggle(event)
				return
			}

			if (highlighted || article.type === 'folder') {
				toggleOpen()
			} else if (isMindmapView) {
				reveal()
			} else {
				navigate({
					to: '/world/$worldId/wiki/$articleId',
					params: { articleId: article.id },
					search: true,
				})
			}
		},
		[
			isBulkSelecting,
			onRowToggle,
			onShiftSelect,
			highlighted,
			article.type,
			article.id,
			toggleOpen,
			isMindmapView,
			reveal,
			navigate,
		],
	)

	const { ref, ghostElement } = useArticleDragDrop({ article, isFolderExpanded: expanded })
	const isGrayscale = useIsFolderGrayedOut(article)
	const theme = useCustomTheme()
	const { setOpacity } = useColorUtils()
	const entityColor = setOpacity(article.color, 0.1)
	const entityColorHover = setOpacity(article.color, 0.15)

	const color = useMemo(() => {
		if (renderHighlighted && theme.mode === 'light') {
			return 'primary.contrastText'
		}
		return 'text.secondary'
	}, [renderHighlighted, theme.mode])

	return (
		<Box
			data-testid={`ArticleListItem/${article.name}/${depth}`}
			data-item-type={article.type}
			sx={{
				pointerEvents: 'none',
			}}
		>
			<Stack
				ref={ref}
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
						<Stack direction="row" alignItems="center" sx={{ gap: 0.5 }}>
							{isBulkSelecting && (
								<Checkbox
									size="small"
									checked={checked}
									readOnly
									tabIndex={-1}
									sx={{ p: 0, pointerEvents: 'none' }}
								/>
							)}
							<ArticleListItemIcon article={article} highlighted={renderHighlighted} folderCollapseIcon />
						</Stack>
					}
					variant={renderHighlighted ? 'contained' : 'text'}
					color="primary"
					onContextMenu={(event) => {
						event.preventDefault()
						onContextMenu(article, event)
					}}
					sx={{
						background: tinted
							? (theme) => alpha(theme.palette.primary.main, 0.18)
							: article.type === 'folder'
								? entityColor
								: undefined,
						'&:hover': {
							background: tinted
								? (theme) => alpha(theme.palette.primary.main, 0.26)
								: article.type === 'folder'
									? entityColorHover
									: undefined,
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
							{article.name}
						</Box>
						<ArticleListItemSecondary entity={article} highlighted={renderHighlighted} />
					</Stack>
					<Box
						className="end-adornment"
						sx={{ opacity: isContextMenuOpen ? 0 : 1, transition: 'opacity 0.15s' }}
					>
						<ArticleListItemEndAdornment article={article} color={color} />
					</Box>
				</Button>
				{!isReadOnly && (
					<ArticleListItemContextMenu
						article={article}
						color={color}
						onContextMenu={onContextMenu}
						isContextMenuOpen={isContextMenuOpen}
					/>
				)}
				{ghostElement}
			</Stack>
			{article.type === 'folder' && (
				<Collapse in={expanded} unmountOnExit sx={{ paddingLeft: 1 }}>
					<ArticleList color={article.color} parentId={article.id} depth={depth + 1} />
				</Collapse>
			)}
		</Box>
	)
}
