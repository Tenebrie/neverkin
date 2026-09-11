import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Outlet } from '@tanstack/react-router'

import { CreateColorModal } from '@/app/features/colors/CreateColorModal'
import { ModalsRenderer } from '@/app/features/modals/ModalsRenderer'
import { RichTextEditorWithFallback } from '@/app/features/richTextEditor/RichTextEditorWithFallback'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'
import { useCheckRouteMatch } from '@/router-utils/hooks/useCheckRouteMatch'
import { useStrictParams } from '@/router-utils/hooks/useStrictParams'
import { ClientToCalliopeMessageType } from '@/ts-shared/ClientToCalliopeMessage'

import { useEventBusDispatch, useEventBusSubscribe } from '../../features/eventBus'
import { SummonableRichTextEditor } from '../../features/richTextEditor/portals/RichTextEditorPortal'
import { EntityModalReporter } from './components/EntityModalReporter'
import { WorldSidebar } from './components/sidebar/WorldSidebar'
import { WikiOutlinerDrawer } from './components/WikiOutlinerDrawer'
import { useLoadWorldInfo } from './hooks/useLoadWorldInfo'
import { CreateActorModal } from './modals/CreateActorModal'
import { CreateEventModal } from './modals/CreateEventModal'
import { DeleteActorModal } from './modals/DeleteActorModal'
import { DeleteEventDeltaModal } from './modals/DeleteEventDeltaModal'
import { DeleteEventModal } from './modals/DeleteEventModal'
import { DeleteTagModal } from './modals/DeleteTagModal'
import { EditEventModal } from './modals/editEventModal/EditEventModal'
import { MarkerTooltipSummoner } from './views/timeline/utils/MarkerTooltip'
import { ArticleListWithHeader } from './views/wiki/articleList/ArticleListWithHeader'

export const World = () => {
	const { worldId } = useStrictParams({
		from: '/world/$worldId/_world',
	})
	const muiTheme = useTheme()
	const isNarrow = useMediaQuery(muiTheme.breakpoints.down('md'))
	const isWiki = useCheckRouteMatch('/world/$worldId/wiki')
	const isMindmap = useCheckRouteMatch('/world/$worldId/mindmap')
	const showWikiOutliner = isMindmap || (isWiki && !isNarrow)
	const sendCalliopeMessage = useEventBusDispatch['calliope/requestSendMessage']()

	useEffectOnce(() => {
		sendCalliopeMessage({
			type: ClientToCalliopeMessageType.WORLD_SUBSCRIBE,
			data: { worldId },
		})

		return () => {
			sendCalliopeMessage({
				type: ClientToCalliopeMessageType.WORLD_UNSUBSCRIBE,
				data: { worldId },
			})
		}
	})

	useEventBusSubscribe['calliope/onReconnected']({
		callback: () => {
			sendCalliopeMessage({
				type: ClientToCalliopeMessageType.WORLD_SUBSCRIBE,
				data: { worldId },
			})
		},
	})

	return (
		<>
			<div
				key={worldId}
				style={{
					position: 'relative',
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
				}}
			>
				<Stack direction="row" width="100%" height="100%">
					{!isNarrow && <WorldSidebar />}
					<div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', overflowX: 'hidden' }}>
						{showWikiOutliner && (
							<WikiOutlinerDrawer>
								<ArticleListWithHeader />
							</WikiOutlinerDrawer>
						)}
						<div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
							<Outlet />
						</div>
					</div>
				</Stack>
			</div>
			{Array(2)
				.fill(0)
				.map((_, index) => (
					<SummonableRichTextEditor key={index}>
						{(props) => <RichTextEditorWithFallback {...props} />}
					</SummonableRichTextEditor>
				))}
			<WorldLoader />
			<EditEventModal />
			<DeleteEventModal />
			<DeleteTagModal />
			<DeleteEventDeltaModal />
			<EntityModalReporter />
			<MarkerTooltipSummoner />
			<CreateEventModal />
			<CreateActorModal />
			<DeleteActorModal />
			<CreateColorModal />
			<ModalsRenderer />
		</>
	)
}

function WorldLoader() {
	const { worldId } = useStrictParams({
		from: '/world/$worldId/_world',
	})
	useLoadWorldInfo(worldId)
	return <></>
}
