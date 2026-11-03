import Stack from '@mui/material/Stack'
import useEvent from 'react-use-event-hook'

import { WorldEvent } from '@/api/types/worldTypes'
import { ArticleListItemIcon } from '@/app/views/world/views/wiki/articleList/icon/ArticleListItemIcon'
import { boxEvent } from '@/app/views/world/views/wiki/utils/boxEntity'
import { EditableTitle } from '@/ui-lib/components/EditableTitle/EditableTitle'

import { EventDraft } from '../draft/useEventDraft'
import { EventTimePopover } from './EventTimePopover'

type Props = {
	event: WorldEvent
	draft: EventDraft
	titleProps?: Partial<Parameters<typeof EditableTitle>[0]>
}

export const EventTitle = ({ event, draft, titleProps }: Props) => {
	const onSave = useEvent((name: string) => {
		draft.setName(name.trim())
	})

	return (
		<EditableTitle
			value={draft.name}
			displayValue={draft.name || event.name || '<Unnamed>'}
			onSave={onSave}
			endAdornment={<EventTimePopover draft={draft} />}
			placeholder="Custom name"
			{...titleProps}
			startAdornment={
				<Stack sx={{ height: 1, marginRight: 0.5 }} direction="row">
					{titleProps?.startAdornment}
					<ArticleListItemIcon
						article={boxEvent({ ...event, icon: draft.icon, color: draft.color })}
						highlighted={false}
					/>
				</Stack>
			}
		/>
	)
}
