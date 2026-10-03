import Cancel from '@mui/icons-material/Cancel'
import Delete from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useDispatch, useSelector } from 'react-redux'

import { useModal } from '@/app/features/modals/ModalsSlice'
import { useIsReadOnly } from '@/app/views/world/hooks/useIsReadOnly'
import { wikiSlice } from '@/app/views/world/views/wiki/WikiSlice'
import { getAllWikiEntityIds, getWikiState } from '@/app/views/world/views/wiki/WikiSliceSelectors'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'

import { ArticleListHeaderCreateButton } from './ArticleListHeaderCreateButton'

export const ArticleListHeader = () => {
	const { name } = useSelector(getWorldState, (a, b) => a.name === b.name)
	const { isBulkSelecting, bulkActionArticles } = useSelector(getWikiState)
	const allEntityIds = useSelector(getAllWikiEntityIds)
	const { open: openbulkDeleteEntitiesModal } = useModal('bulkDeleteEntitiesModal')

	const { isReadOnly } = useIsReadOnly()

	const { setBulkSelecting, addToBulkSelection, clearBulkSelection } = wikiSlice.actions
	const dispatch = useDispatch()

	const onChange = () => {
		if (bulkActionArticles.length < allEntityIds.length) {
			dispatch(addToBulkSelection({ articles: allEntityIds }))
		} else {
			dispatch(clearBulkSelection())
		}
	}

	const onCancel = () => {
		dispatch(setBulkSelecting(false))
		dispatch(clearBulkSelection())
	}

	return (
		<Stack sx={{ height: '32px' }} direction="row">
			{isBulkSelecting && (
				<Checkbox
					checked={bulkActionArticles.length > 0}
					indeterminate={bulkActionArticles.length > 0 && bulkActionArticles.length < allEntityIds.length}
					size="small"
					sx={{
						width: 32,
						height: 32,
					}}
					onChange={() => onChange()}
				/>
			)}
			<Stack direction="row" justifyContent="space-between" width="100%" sx={{ minWidth: 0 }}>
				<Typography variant="h6" marginLeft={1} sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
					{!isBulkSelecting && (
						<Box
							sx={{
								overflow: 'hidden',
								whiteSpace: 'nowrap',
								textOverflow: 'ellipsis',
							}}
						>
							{name}
						</Box>
					)}
				</Typography>
				{!isBulkSelecting && !isReadOnly && (
					<Box sx={{ flexShrink: 0 }}>
						<ArticleListHeaderCreateButton folderId={null} />
					</Box>
				)}
				{isBulkSelecting && (
					<Stack direction="row" gap={1}>
						<Button
							color="secondary"
							variant="outlined"
							sx={{ minWidth: 64 }}
							startIcon={<Cancel />}
							onClick={() => onCancel()}
						>
							Cancel
						</Button>
						<Button
							color="error"
							variant="outlined"
							disabled={bulkActionArticles.length === 0}
							sx={{ minWidth: 64 }}
							startIcon={<Delete />}
							onClick={() => openbulkDeleteEntitiesModal({ articles: bulkActionArticles })}
						>
							Delete
						</Button>
					</Stack>
				)}
			</Stack>
		</Stack>
	)
}
