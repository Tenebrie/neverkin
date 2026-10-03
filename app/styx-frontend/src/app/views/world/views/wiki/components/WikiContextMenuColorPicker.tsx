import Add from '@mui/icons-material/Add'
import MoreHoriz from '@mui/icons-material/MoreHoriz'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'

import { SavedColors } from '@/app/components/ColorPicker/SavedColors'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { useUpdateActor } from '@/app/views/world/api/useUpdateActor'
import { useUpdateArticle } from '@/app/views/world/api/useUpdateArticle'
import { useUpdateEvent } from '@/app/views/world/api/useUpdateEvent'
import { useUpdateFolder } from '@/app/views/world/api/useUpdateFolder'
import { useUpdateTag } from '@/app/views/world/api/useUpdateTag'
import { Header } from '@/ui-lib/components/Header/Header'

import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'

type Props = {
	article: BoxedWikiEntity
	onClose: () => void
}

export function WikiContextMenuColorPicker({ article, onClose }: Props) {
	const [updateActor] = useUpdateActor()
	const [updateArticle] = useUpdateArticle()
	const [updateFolder] = useUpdateFolder()
	const [updateEvent] = useUpdateEvent()
	const [updateTag] = useUpdateTag()

	const { open: openCreateColorModal } = useModal('createColorModal')

	const onSelectColor = (color: string) => {
		switch (article.type) {
			case 'actor':
				updateActor(article.id, { color })
				break
			case 'article':
				updateArticle(article.id, { color })
				break
			case 'event':
				updateEvent(article.id, { color })
				break
			case 'tag':
				updateTag(article.id, { color })
				break
			case 'folder':
				updateFolder(article.id, { color })
				break
		}
		onClose()
	}

	const [limit, setLimit] = useState(4)

	return (
		<Stack sx={{ padding: '6px 12px' }} gap={1}>
			<Header
				endAdornment={
					<Button
						size="small"
						sx={{ minWidth: 0, borderRadius: '50%', padding: 0.35, margin: 0 }}
						color="secondary"
						onClick={() => {
							openCreateColorModal({})
							onClose()
						}}
					>
						<Add />
					</Button>
				}
				variant="h3"
			>
				Color
			</Header>
			<Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" maxWidth={156}>
				<SavedColors currentColor={article.color} onSelectColor={onSelectColor} size={20} limit={limit} />
				{limit < Infinity && (
					<Tooltip title="Show all colors" disableInteractive enterDelay={500}>
						<Button
							size="small"
							onClick={() => setLimit(Infinity)}
							sx={{ width: 28, height: 24, minWidth: 'unset' }}
							color="secondary"
						>
							<MoreHoriz />
						</Button>
					</Tooltip>
				)}
			</Stack>
		</Stack>
	)
}
