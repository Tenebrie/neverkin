import AccountTreeIcon from '@mui/icons-material/AccountTreeRounded'
import Check from '@mui/icons-material/Check'
import Delete from '@mui/icons-material/Delete'
import Edit from '@mui/icons-material/Edit'
import WikiIcon from '@mui/icons-material/HistoryEduRounded'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import { bindMenu, PopupState } from 'material-ui-popup-state/hooks'
import { useDispatch, useSelector } from 'react-redux'

import { useModal } from '@/app/features/modals/ModalsSlice'
import { useIsMindmapView } from '@/app/views/world/hooks/useIsMindmapView'
import { useMindmapData } from '@/app/views/world/views/mindmap/api/useMindmapData'
import { useRevealInMindmap } from '@/app/views/world/views/mindmap/hooks/useRevealInMindmap'
import { getMindmapNodeParentId } from '@/app/views/world/views/mindmap/utils/getMindmapNodeParentId'
import { wikiSlice } from '@/app/views/world/views/wiki/WikiSlice'
import { getWikiState } from '@/app/views/world/views/wiki/WikiSliceSelectors'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { WikiContextMenuColorPicker } from './WikiContextMenuColorPicker'

type Props = {
	article: BoxedWikiEntity
	popupState: PopupState
}

export function WikiContextMenu({ article, popupState }: Props) {
	const { bulkActionArticles } = useSelector(getWikiState)
	const { open: openbulkDeleteEntitiesModal } = useModal('bulkDeleteEntitiesModal')
	const { open: openRenameFolderModal } = useModal('renameFolderModal')

	const { setLastCheckedArticle, addToBulkSelection, removeFromBulkSelection } = wikiSlice.actions
	const dispatch = useDispatch()

	const isMindmapView = useIsMindmapView()
	const reveal = useRevealInMindmap(article)
	const canReveal = useMindmapData().nodes.some((node) => getMindmapNodeParentId(node) === article.id)
	const navigate = useStableNavigate({ from: '/world/$worldId' })

	return (
		<Menu {...bindMenu(popupState)} disableRestoreFocus disableEnforceFocus>
			{!bulkActionArticles.includes(article.id) && (
				<Stack>
					<WikiContextMenuColorPicker article={article} onClose={popupState.close} />
					<Divider sx={{ my: 1 }} />
					{article.type === 'folder' && (
						<>
							<MenuItem
								onClick={() => {
									openRenameFolderModal({ folderId: article.id, folderName: article.name })
									popupState.close()
								}}
							>
								<ListItemIcon>
									<Edit />
								</ListItemIcon>
								<ListItemText>Rename</ListItemText>
							</MenuItem>
							<Divider />
						</>
					)}
					{canReveal && (!isMindmapView || article.type === 'folder') && (
						<MenuItem
							onClick={() => {
								reveal()
								popupState.close()
							}}
						>
							<ListItemIcon>
								<AccountTreeIcon />
							</ListItemIcon>
							<ListItemText>Reveal in Mindmap</ListItemText>
						</MenuItem>
					)}
					{isMindmapView && article.type !== 'folder' && (
						<MenuItem
							onClick={() => {
								navigate({
									to: '/world/$worldId/wiki/$articleId',
									params: { articleId: article.id },
									search: true,
								})
								popupState.close()
							}}
						>
							<ListItemIcon>
								<WikiIcon />
							</ListItemIcon>
							<ListItemText>Edit in Wiki</ListItemText>
						</MenuItem>
					)}
					<MenuItem
						onClick={() => {
							dispatch(setLastCheckedArticle({ article: article.id }))
							dispatch(addToBulkSelection({ articles: [article.id] }))
							popupState.close()
						}}
					>
						<ListItemIcon>
							<Check />
						</ListItemIcon>
						<ListItemText>Select</ListItemText>
					</MenuItem>
				</Stack>
			)}
			{bulkActionArticles.includes(article.id) && (
				<MenuItem
					onClick={() => {
						dispatch(setLastCheckedArticle({ article: article.id }))
						dispatch(removeFromBulkSelection({ articles: [article.id] }))
						popupState.close()
					}}
				>
					<ListItemIcon>
						<Check />
					</ListItemIcon>
					<ListItemText>Unselect</ListItemText>
				</MenuItem>
			)}
			<MenuItem
				color="error"
				onClick={() => {
					openbulkDeleteEntitiesModal({ articles: [article.id] })
					popupState.close()
				}}
			>
				<ListItemIcon>
					<Delete />
				</ListItemIcon>
				<ListItemText color="error">Delete</ListItemText>
			</MenuItem>
		</Menu>
	)
}
