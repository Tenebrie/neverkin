import { alpha } from '@mui/material'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { memo, useMemo } from 'react'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

import { ArticleListItemIcon } from '../../wiki/articleList/icon/ArticleListItemIcon'
import { BoxedMindmapParent } from '../hooks/useBoxedMindmapContent'
import { ActorNodeContentMeta } from './ActorNodeContentMeta'
import { ActorNodeContentMetaFolder } from './ActorNodeContentMetaFolder'
import { MindmapNodePort } from './MindmapNodePort'
import { NODE_W } from './mindmapWireUtils'

type Props = {
	node?: MindmapNode
	parent: BoxedMindmapParent
	onHeaderClick?: (e: React.MouseEvent) => void
	onContentClick?: () => void
}

export const ActorNodeContent = memo(ActorNodeContentComponent)

function ActorNodeContentComponent({ node, parent, onHeaderClick }: Props) {
	const theme = useCustomTheme()

	const description = useMemo(() => {
		const content = (() => {
			if ('content' in parent.entity) {
				return parent.entity.content
			}
			return ''
		})()
		const firstParagraph = content.split('\n')[0]
		if (firstParagraph.length < content.length - 1) {
			return {
				content: firstParagraph,
				more: true,
			}
		}
		return { content: firstParagraph }
	}, [parent.entity])

	return (
		<Box
			sx={{
				userSelect: 'none',
				width: `${NODE_W}px`,
				borderRadius: '14px',
				overflow: 'hidden',
				position: 'relative',
				background: theme.custom.palette.background.soft,
				boxShadow:
					theme.mode === 'light' ? '0 1px 4px rgba(20, 10, 50, 0.18)' : '0 1px 4px rgba(0, 0, 0, 0.4)',
				transition: 'box-shadow 0.2s ease-out, transform 0.2s ease-out',
				// border: (theme) => `1px solid ${theme.palette.divider}`,
				'&:has(:hover):not(:has([data-mindmap-port]:hover))': {
					boxShadow: '0 6px 10px rgba(0,0,0,0.2)',
				},
			}}
		>
			<Stack
				direction="row"
				gap={1}
				sx={{
					padding: '12px',
				}}
				onClick={onHeaderClick}
			>
				<Box sx={{ width: 24, height: 24 }}>
					{parent.type === 'node' ? (
						<EntityIcon variant="node" height={24} color={parent.color} />
					) : (
						<ArticleListItemIcon article={parent} highlighted={false} />
					)}
				</Box>

				<Box sx={{ width: 1 }}>
					{/* Header */}
					<Stack
						data-mindmap-header
						sx={{
							flexDirection: 'row',
							userSelect: 'none',
							gap: 1,
							alignItems: 'flex-start',
						}}
					>
						<Stack
							sx={{
								flexDirection: 'row',
								width: '100%',
								gap: 1.25,
							}}
						>
							<Stack gap={0.5}>
								<Box
									sx={{
										fontWeight: 'bold',
										fontSize: '0.7rem',
										color: parent.color,
										textTransform: 'uppercase',
										letterSpacing: 0.75,
									}}
								>
									{parent.type}
								</Box>
								<Box
									sx={{
										fontWeight: 'bold',
										fontSize: '0.9rem',
										color: theme.material.palette.text.primary,
										display: '-webkit-box',
										WebkitLineClamp: 2,
										WebkitBoxOrient: 'vertical',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
								>
									{parent.name}
								</Box>
							</Stack>
						</Stack>
						<Box sx={{ marginTop: '-12px', marginRight: '-12px' }}>
							<MindmapNodePort node={node} parent={parent} />
						</Box>
					</Stack>

					{/* Content */}
					{parent.type !== 'folder' && description.content.length > 0 && (
						<Box
							data-mindmap-content
							sx={{
								fontSize: '0.8rem',
								lineHeight: 1.4,
								marginTop: 2,
								display: '-webkit-box',
								WebkitLineClamp: 3,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
							}}
						>
							{description.content.slice(0, 150)}
						</Box>
					)}
				</Box>
			</Stack>
			<Divider
				sx={{
					borderColor: (theme) => alpha(theme.palette.divider, 0.05),
				}}
			/>
			{parent.type !== 'folder' && <ActorNodeContentMeta parent={parent} />}
			{parent.type === 'folder' && <ActorNodeContentMetaFolder parent={parent} />}
		</Box>
	)
}
