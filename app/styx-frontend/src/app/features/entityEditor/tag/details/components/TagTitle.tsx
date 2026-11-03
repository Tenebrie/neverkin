import Stack from '@mui/material/Stack'
import useEvent from 'react-use-event-hook'

import { WorldTag } from '@/api/types/worldTypes'
import { ArticleListItemIcon } from '@/app/views/world/views/wiki/articleList/icon/ArticleListItemIcon'
import { boxTag } from '@/app/views/world/views/wiki/utils/boxEntity'
import { EditableTitle } from '@/ui-lib/components/EditableTitle/EditableTitle'

import { TagDraft } from '../draft/useTagDraft'

type Props = {
	tag: WorldTag
	draft: TagDraft
	titleProps?: Partial<Parameters<typeof EditableTitle>[0]>
}

export const TagTitle = ({ tag, draft, titleProps }: Props) => {
	const onSave = useEvent((name: string) => {
		draft.setName(name.trim())
	})

	return (
		<EditableTitle
			data-testid="TagTitle"
			value={draft.name}
			displayValue={draft.name || '<Name>'}
			onSave={onSave}
			placeholder="Tag name"
			{...titleProps}
			startAdornment={
				<Stack sx={{ height: 1, marginRight: 0.5 }} direction="row">
					{titleProps?.startAdornment}
					<ArticleListItemIcon article={boxTag(tag)} highlighted={false} />
				</Stack>
			}
		/>
	)
}
