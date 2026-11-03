import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { memo } from 'react'

import { Actor } from '@/api/types/worldTypes'
import { ColorPicker } from '@/app/components/ColorPicker/ColorPicker'
import { IconPicker } from '@/app/components/IconPicker/IconPicker'
import { EntityEditorTabs } from '@/app/features/entityEditor/common/EntityEditorTabs'
import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import { EditableTitle } from '@/ui-lib/components/EditableTitle/EditableTitle'

import { useCurrentOrNewActor } from '../hooks/useCurrentOrNewActor'
import { ActorBacklinks } from './components/ActorBacklinks'
import { ActorDescription } from './components/ActorDescription'
import { ActorTitle } from './components/ActorTitle'
import { useActorDraft } from './draft/useActorDraft'
import { useUpsertActor } from './draft/useUpsertActor'

type Props = {
	editedActor: Actor
	titleProps?: Partial<Parameters<typeof EditableTitle>[0]>
	surface?: string
}

export const ActorDetails = memo(ActorDetailsComponent)

export function ActorDetailsComponent({ editedActor, titleProps, surface }: Props) {
	const { mode, actor } = useCurrentOrNewActor({ editedActor })
	const draft = useActorDraft({ actor })
	const navigate = useStableNavigate({ from: '/world/$worldId/timeline' })

	useUpsertActor({
		mode,
		draft,
		onCreate: (createdActor) => {
			navigate({
				to: '/world/$worldId/mindmap',
				search: (prev) => ({ ...prev, navi: [createdActor.id] }),
			})
		},
	})

	const fluidHeight = surface === 'wiki'

	return (
		<Stack
			gap={1}
			sx={{
				height: fluidHeight ? 'auto' : '100%',
				...useBrowserSpecificScrollbars(),
			}}
		>
			<ActorTitle actor={actor} draft={draft} titleProps={titleProps} />
			<Divider />
			<Box flexGrow={1} height={fluidHeight ? 'auto' : 0} sx={{ marginRight: 0 }}>
				<EntityEditorTabs
					contentTab={<ActorDescription actor={actor} surface={surface} />}
					fluidHeight={fluidHeight}
					illustrationTab={
						<Stack gap={2} sx={{ height: '100%', overflow: 'auto', marginRight: -0.5 }}>
							<Stack gap={2} sx={{ marginRight: 2 }}>
								<ColorPicker
									key={'color-' + draft.id + '-' + draft.key}
									initialValue={draft.color}
									onChangeHex={draft.setColor}
								/>
								<IconPicker
									key={'icon-' + draft.id}
									color={draft.color}
									defaultQuery={draft.icon}
									onSelect={draft.setIcon}
								/>
							</Stack>
						</Stack>
					}
					backlinksTab={<ActorBacklinks actorId={actor.id} />}
				/>
			</Box>
		</Stack>
	)
}
