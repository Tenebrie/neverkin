import Stack from '@mui/material/Stack'
import { memo } from 'react'

import { WorldTag } from '@/api/types/worldTypes'
import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'
import { EditableTitle } from '@/ui-lib/components/EditableTitle/EditableTitle'

import { TagMentionedBy } from './components/TagMentionedBy'
import { TagTitle } from './components/TagTitle'
import { useTagDraft } from './draft/useTagDraft'
import { useUpdateTag } from './draft/useUpdateTag'

type Props = {
	editedTag: WorldTag
	titleProps?: Partial<Parameters<typeof EditableTitle>[0]>
}

export const TagDetails = memo(TagDetailsComponent)

export function TagDetailsComponent({ editedTag, titleProps }: Props) {
	const draft = useTagDraft({ tag: editedTag })

	useUpdateTag({ draft })

	return (
		<Stack
			gap={2}
			sx={{
				height: '100%',
				...useBrowserSpecificScrollbars(),
			}}
		>
			<TagTitle tag={editedTag} draft={draft} titleProps={titleProps} />
			<TagMentionedBy tagId={editedTag.id} />
		</Stack>
	)
}
