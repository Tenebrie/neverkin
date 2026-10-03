import AlternateEmail from '@mui/icons-material/AlternateEmail'
import History from '@mui/icons-material/History'
import Stack from '@mui/material/Stack'

import { formatTimeAgo } from '@/app/utils/formatTimeAgo'
import { pluralize } from '@/app/utils/pluralize'
import { MindmapNodeParentParcel } from '@/app/views/world/views/mindmap/types'

import { MindmapNodeContentMetaEvent } from './MindmapNodeContentMetaEvent'
import { MindmapNodeContentMetaFolder } from './MindmapNodeContentMetaFolder'

type Props = {
	parent: MindmapNodeParentParcel
}

export function MindmapNodeContentMeta({ parent }: Props) {
	return (
		<Stack
			direction="row"
			gap={1}
			sx={{
				alignItems: 'center',
				fontSize: '0.8rem',
				lineHeight: 1.4,
				padding: '8px 16px',
				color: 'text.disabled',
			}}
		>
			{renderLabel(parent)}
		</Stack>
	)
}

function renderLabel(parent: MindmapNodeParentParcel) {
	if (parent.type === 'event') {
		return <MindmapNodeContentMetaEvent timestamp={parent.entity.timestamp} />
	}
	if (parent.type === 'folder') {
		return <MindmapNodeContentMetaFolder folderId={parent.id} />
	}
	if (parent.type === 'tag') {
		return (
			<>
				<AlternateEmail sx={{ fontSize: '1rem' }} />
				{pluralize(parent.entity.mentionedIn.length, 'mention')}
			</>
		)
	}
	return (
		<>
			<History sx={{ fontSize: '1rem' }} />
			Updated {formatTimeAgo(new Date(parent.entity.updatedAt))}
		</>
	)
}
