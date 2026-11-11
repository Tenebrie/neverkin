import Add from '@mui/icons-material/Add'
import MoreHoriz from '@mui/icons-material/MoreHoriz'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'

import { SavedColors } from '@/app/components/ColorPicker/SavedColors'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { useBulkUpdate } from '@/app/views/world/api/useBulkUpdate'
import { MindmapNodeParentParcel } from '@/app/views/world/views/mindmap/types'
import { Header } from '@/ui-lib/components/Header/Header'

type Props = {
	entities: MindmapNodeParentParcel[]
	onClose: () => void
}

export function WikiContextMenuColorPicker({ entities, onClose }: Props) {
	const [bulkUpdate] = useBulkUpdate()

	const { open: openCreateColorModal } = useModal('createColorModal')

	const onSelectColor = (color: string) => {
		bulkUpdate({ entities: entities.map((entity) => entity.id), color })
		onClose()
	}

	const firstColor = entities[0]?.color
	const currentColor = entities.every((entity) => entity.color === firstColor) ? firstColor : undefined

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
				<SavedColors currentColor={currentColor} onSelectColor={onSelectColor} size={20} limit={limit} />
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
