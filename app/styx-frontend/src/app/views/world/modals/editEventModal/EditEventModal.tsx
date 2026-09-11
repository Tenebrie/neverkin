import Stack from '@mui/material/Stack'
import useEvent from 'react-use-event-hook'

import { ActorDetails } from '@/app/features/entityEditor/actor/details/ActorDetails'
import { ArticleDetails } from '@/app/features/entityEditor/article/details/ArticleDetails'
import { EventDetails } from '@/app/features/entityEditor/event/details/EventDetails'
import { NodeDetails } from '@/app/features/entityEditor/node/details/NodeDetails'
import { TagDetails } from '@/app/features/entityEditor/tag/details/TagDetails'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import Modal from '@/ui-lib/components/Modal'

import { EntityBreadcrumbs } from './EntityBreadcrumbs'
import { useCurrentEntity } from './hooks/useCurrentEntity'

export const EditEventModal = () => {
	const { isOpen, entityStack } = useModal('editEventModal')
	const navigate = useStableNavigate({ from: '/world/$worldId' })

	const handleClose = useEvent(() => {
		const newStack = [...entityStack]
		if (entityStack.length > 0) {
			newStack.pop()
		}
		navigate({
			search: (prev) => ({
				...prev,
				navi: newStack,
				new: undefined,
				tab: undefined,
				iq: undefined,
			}),
		})
	})

	const handleBreadcrumbClick = useEvent((targetIndex: number) => {
		const newStack = entityStack.slice(0, targetIndex + 1)
		navigate({
			search: (prev) => ({
				...prev,
				navi: newStack,
			}),
		})
	})

	const handleWorldClick = useEvent(() => {
		navigate({
			search: (prev) => ({
				...prev,
				navi: [],
				new: undefined,
			}),
		})
	})

	const handleCurrentClick = useEvent(() => {
		if (entityStack.length == 0) {
			return
		}
		navigate({
			from: '/world/$worldId',
			to: '/world/$worldId/wiki/$articleId',
			params: {
				articleId: entityStack[entityStack.length - 1],
			},
			search: (prev) => ({
				...prev,
				navi: [],
			}),
		})
	})

	const currentEntity = useCurrentEntity()

	return (
		<Modal visible={isOpen} onClose={handleClose} closeOnBackdropClick>
			<Stack
				direction={'column'}
				gap={2}
				sx={{
					height: '95vh',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<EntityBreadcrumbs
					entityStack={entityStack}
					onBreadcrumbClick={handleBreadcrumbClick}
					onWorldClick={handleWorldClick}
					onCurrentClick={handleCurrentClick}
					onClose={handleClose}
				/>

				<Stack direction="row" width="100%" height="100%" flexDirection="column">
					{currentEntity?.type === 'event' && currentEntity.entity && (
						<EventDetails editedEvent={currentEntity.entity} surface="editEventModal" />
					)}
					{currentEntity?.type === 'actor' && currentEntity.entity && (
						<ActorDetails editedActor={currentEntity.entity} surface="editEventModal" />
					)}
					{currentEntity?.type === 'article' && currentEntity.entity && (
						<ArticleDetails article={currentEntity.entity} surface="editEventModal" />
					)}
					{currentEntity?.type === 'tag' && currentEntity.entity && (
						<TagDetails editedTag={currentEntity.entity} />
					)}
					{currentEntity?.type === 'node' && currentEntity.entity && (
						<NodeDetails node={currentEntity.entity} surface="editEventModal" />
					)}
				</Stack>
			</Stack>
		</Modal>
	)
}
