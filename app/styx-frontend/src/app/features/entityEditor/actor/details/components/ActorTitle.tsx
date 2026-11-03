import Stack from '@mui/material/Stack'
import useEvent from 'react-use-event-hook'

import { Actor } from '@/api/types/worldTypes'
import { ArticleListItemIcon } from '@/app/views/world/views/wiki/articleList/icon/ArticleListItemIcon'
import { boxActor } from '@/app/views/world/views/wiki/utils/boxEntity'
import { EditableTitle } from '@/ui-lib/components/EditableTitle/EditableTitle'

import { ActorDraft } from '../draft/useActorDraft'

type Props = {
	actor: Actor
	draft: ActorDraft
	titleProps?: Partial<Parameters<typeof EditableTitle>[0]>
}

export function ActorTitle({ actor, draft, titleProps }: Props) {
	const value = draft.title ? `${draft.name}, ${draft.title}` : draft.name

	const onSave = useEvent((name: string) => {
		const parts = name.split(',')
		draft.setName(parts[0].trim())
		draft.setTitle((parts[1] ?? '').trim())
	})

	return (
		<EditableTitle
			value={value}
			displayValue={value || '<Name>'}
			onSave={onSave}
			placeholder="Actor name, Actor title"
			{...titleProps}
			startAdornment={
				<Stack sx={{ height: 1, marginRight: 0.5 }} direction="row">
					{titleProps?.startAdornment}
					<ArticleListItemIcon
						article={boxActor({ ...actor, icon: draft.icon, color: draft.color })}
						highlighted={false}
					/>
				</Stack>
			}
		/>
	)
}
