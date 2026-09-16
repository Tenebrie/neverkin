import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useStore } from 'react-redux'

import { useDragDrop } from '@/app/features/dragDrop/hooks/useDragDrop'
import { useDragDropReceiver } from '@/app/features/dragDrop/hooks/useDragDropReceiver'
import { useDragHoverExpand } from '@/app/features/dragDrop/hooks/useDragHoverExpand'
import { RootState } from '@/app/store'

import { useBulkWikiMove } from '../../../api/useBulkWikiMove'
import { useMoveArticle } from '../../../api/useMoveArticle'
import { NewNodeGhost } from '../../mindmap/components/NewNodeGhost'
import { getHoveredMindmapClickArea } from '../../mindmap/utils/getHoveredMindmapClickArea'
import { getHoveredMindmapNode } from '../../mindmap/utils/getHoveredMindmapNode'
import { useArticleCollapseControls } from '../articleList/hooks/useArticleCollapseControls'
import { ArticleListItemIcon } from '../articleList/icon/ArticleListItemIcon'
import { getWikiState } from '../WikiSliceSelectors'
import { BoxedWikiEntity } from './useBoxedWikiContent'

type Props = {
	article: BoxedWikiEntity
	isFolderExpanded: boolean
}

export function useArticleDragDrop({ article, isFolderExpanded }: Props) {
	const [moveEntity] = useMoveArticle()
	const [bulkMoveEntities] = useBulkWikiMove()
	const { forceOpen } = useArticleCollapseControls(article)

	const store = useStore<RootState>()

	const { ref, ghostElement } = useDragDrop({
		type: 'articleListItem',
		ghostAlign: {
			top: 'center',
			left: 'center',
		},
		adjustPosition: (pos) => {
			const hoveredNode = getHoveredMindmapNode()
			if (!hoveredNode) {
				return pos
			}

			// Snap onto the node being replaced
			const rect = hoveredNode.getBoundingClientRect()
			return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
		},
		ghostFactory: () => {
			if (getHoveredMindmapClickArea() || getHoveredMindmapNode()) {
				return <NewNodeGhost entityHandle={article} />
			}

			return (
				<Button
					startIcon={<ArticleListItemIcon article={article} highlighted={false} />}
					color="secondary"
					variant="contained"
					sx={{ justifyContent: 'start', opacity: 0.3, width: '300px', filter: 'grayscale(100%)' }}
				>
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
				</Button>
			)
		},
		params: { article },
	})

	useDragDropReceiver({
		type: 'articleListItem',
		receiverRef: ref,
		onDrop: async ({ params, targetRootPos }, event) => {
			event.markHandled()
			if (params.article.id === article.id || !ref.current) {
				return
			}

			const targetRect = ref.current.getBoundingClientRect()
			const dropY = event.mouseEvent?.clientY ?? targetRootPos.y
			const isTopHalf = dropY < targetRect.top + targetRect.height / 2
			const delta = isTopHalf ? -1 : 1

			const { bulkActionArticles } = getWikiState(store.getState())
			if (bulkActionArticles.includes(params.article.id)) {
				if (!isTopHalf && article.type === 'folder' && isFolderExpanded) {
					await bulkMoveEntities({
						entityIds: bulkActionArticles,
						parentId: article.id,
						position: -1,
					})
				} else {
					await bulkMoveEntities({
						entityIds: bulkActionArticles,
						parentId: article.entity.parentFolderId,
						position: article.position + delta,
					})
				}

				return
			}

			if (!isTopHalf && article.type === 'folder' && isFolderExpanded) {
				await moveEntity({
					entityId: params.article.id,
					entityType: article.type,
					parentId: article.id,
					position: -1,
				})
				return
			}

			await moveEntity({
				entityId: params.article.id,
				entityType: article.type,
				parentId: article.entity.parentFolderId,
				position: article.position + delta,
			})
		},
	})

	useDragHoverExpand({
		type: 'articleListItem',
		targetRef: ref,
		enabled: article.type === 'folder' && !isFolderExpanded,
		onTrigger: forceOpen,
	})

	return {
		ref,
		ghostElement,
	}
}
