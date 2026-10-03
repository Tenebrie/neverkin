import AlternateEmail from '@mui/icons-material/AlternateEmail'
import History from '@mui/icons-material/History'
import Stack from '@mui/material/Stack'

import { formatTimeAgo } from '@/app/utils/formatTimeAgo'
import { pluralize } from '@/app/utils/pluralize'
import { MindmapNodeParentParcel } from '@/app/views/world/views/mindmap/types'

import { ActorNodeContentMetaEvent } from './ActorNodeContentMetaEvent'
import { ActorNodeContentMetaFolder } from './ActorNodeContentMetaFolder'

type Props = {
	parent: MindmapNodeParentParcel
}

export function ActorNodeContentMeta({ parent }: Props) {
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
		return <ActorNodeContentMetaEvent timestamp={parent.entity.timestamp} />
	}
	if (parent.type === 'folder') {
		return <ActorNodeContentMetaFolder folderId={parent.id} />
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
