import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { alpha, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'
import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'
import { useMobileLayout } from '@/app/hooks/useMobileLayout'
import { HomeRowItemIconButton } from '@/app/views/home/components/rowItem/HomeRowItemIconButton'
import { HomeSection } from '@/app/views/home/components/section/HomeSection'
import { HomeSectionHeader } from '@/app/views/home/components/section/HomeSectionHeader'
import { useIsReadOnly } from '@/app/views/world/hooks/useIsReadOnly'
import { getWorldStateLoaded } from '@/app/views/world/WorldSliceSelectors'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { ArticleListItemIcon } from '../articleList/icon/ArticleListItemIcon'
import { BoxedWikiEntity, useBoxedWikiContent } from '../hooks/useBoxedWikiContent'
import { useScreenCenteredColumn, WIKI_COLUMN_MAX_WIDTH } from '../hooks/useScreenCenteredColumn'
import { getWikiState, getWikiStateLoaded } from '../WikiSliceSelectors'
import { useRecentlyChanged } from './hooks/useRecentlyChanged'
import { useRecentlyOpened } from './hooks/useRecentlyOpened'
import { useLooseThreads } from './lint/useLooseThreads'
import { WikiLandingFirstRun } from './WikiLandingFirstRun'
import { WikiLandingHeader } from './WikiLandingHeader'
import { WikiLandingResumeBanner } from './WikiLandingResumeBanner'
import { WikiLandingRow } from './WikiLandingRow'
import { WikiLandingRowTimestamp } from './WikiLandingRowTimestamp'

const MAX_ALSO_OPENED = 4
const MAX_LOOSE_THREADS = 8

export function WikiLanding() {
	const isWorldLoaded = useSelector(getWorldStateLoaded)
	const isWikiLoaded = useSelector(getWikiStateLoaded)
	const { folders } = useSelector(getWikiState, (a, b) => a.folders === b.folders)
	const { isReadOnly } = useIsReadOnly()
	const { isMobile } = useMobileLayout()
	const { palette } = useTheme()
	const scrollbars = useBrowserSpecificScrollbars()
	const columnRef = useScreenCenteredColumn(!isMobile)
	const navigate = useStableNavigate({ from: '/world/$worldId' })

	const { visibleEntities, hiddenCount } = useBoxedWikiContent()
	const { entries } = useRecentlyOpened()
	const { threads, dismiss } = useLooseThreads(visibleEntities)

	const recentlyOpened = useMemo(() => {
		const entitiesById = new Map(visibleEntities.map((entity) => [entity.id, entity]))
		return entries.flatMap((entry) => {
			const entity = entitiesById.get(entry.entityId)
			return entity ? [{ entity, openedAt: entry.openedAt }] : []
		})
	}, [entries, visibleEntities])
	const shownRecentlyOpened = useMemo(() => recentlyOpened.slice(0, 1 + MAX_ALSO_OPENED), [recentlyOpened])
	const [lead, ...alsoOpened] = shownRecentlyOpened
	const recentlyChanged = useRecentlyChanged(visibleEntities, shownRecentlyOpened)

	const folderNameOf = useCallback(
		(entity: BoxedWikiEntity) => folders.find((folder) => folder.id === entity.entity.parentFolderId)?.name,
		[folders],
	)
	const open = useCallback(
		(entity: BoxedWikiEntity) =>
			navigate({ to: '/world/$worldId/wiki/$articleId', params: { articleId: entity.id }, search: true }),
		[navigate],
	)

	if (!isWorldLoaded || !isWikiLoaded) {
		return null
	}

	if (visibleEntities.length === 0 && hiddenCount === 0) {
		return <WikiLandingFirstRun />
	}

	const entityRow = (entity: BoxedWikiEntity, openedAt?: number) => (
		<WikiLandingRow
			key={entity.id}
			icon={<ArticleListItemIcon article={entity} highlighted={false} />}
			label={entity.name}
			meta={folderNameOf(entity)}
			onClick={() => open(entity)}
		>
			<WikiLandingRowTimestamp date={new Date(openedAt ?? entity.entity.updatedAt)} />
		</WikiLandingRow>
	)

	return (
		<Box
			sx={{
				height: '100%',
				width: '100%',
				paddingX: isMobile ? 2 : '44px',
				boxSizing: 'border-box',
				overflowY: 'auto',
				display: 'flex',
				flexDirection: 'row',
				background: `radial-gradient(900px 560px at 30% -10%, ${alpha(palette.primary.main, 0.08)}, transparent 70%), ${palette.background.default}`,
				...scrollbars,
			}}
		>
			<Stack
				ref={columnRef}
				gap={3}
				sx={{
					maxWidth: WIKI_COLUMN_MAX_WIDTH,
					width: '100%',
					minWidth: 0,
					alignSelf: 'flex-start',
					pt: isMobile ? 1.5 : 4,
					pb: '50vh',
				}}
			>
				<WikiLandingHeader />

				{lead && (
					<Stack gap={1.5}>
						<Stack direction="row" alignItems="center" sx={{ px: 0.25, minHeight: 34 }}>
							<HomeSectionHeader>Continue</HomeSectionHeader>
						</Stack>
						<WikiLandingResumeBanner
							entity={lead.entity}
							folderName={folderNameOf(lead.entity)}
							openedAt={lead.openedAt}
							onResume={() => open(lead.entity)}
						/>
					</Stack>
				)}

				{alsoOpened.length > 0 && (
					<HomeSection label="Also open recently" count={alsoOpened.length}>
						{alsoOpened.map(({ entity, openedAt }) => entityRow(entity, openedAt))}
					</HomeSection>
				)}

				<HomeSection label="Recently changed" count={recentlyChanged.length}>
					{recentlyChanged.map((entity) => entityRow(entity))}
				</HomeSection>

				{!isReadOnly && threads.length > 0 && (
					<HomeSection label="Loose threads" count={threads.length}>
						{threads.slice(0, MAX_LOOSE_THREADS).map((thread) => (
							<WikiLandingRow
								key={thread.key}
								icon={
									<EntityInitialsTile
										name={thread.label}
										color={palette.warning.main}
										size={28}
										icon={<Box sx={{ display: 'flex', '& svg': { fontSize: 16 } }}>{thread.icon}</Box>}
									/>
								}
								label={thread.label}
								meta={thread.message}
								onClick={() => open(thread.entity)}
							>
								<Typography variant="caption" fontWeight={600} color="primary.main" noWrap>
									{thread.action}
								</Typography>
								<HomeRowItemIconButton
									className="dismiss-button"
									aria-label="Dismiss"
									onClick={() => dismiss(thread.key)}
									sx={{
										p: '2px',
										opacity: 0,
										transition: 'opacity 0.16s',
										'&:focus-visible': { opacity: 1 },
									}}
								>
									<CloseIcon sx={{ fontSize: 16 }} />
								</HomeRowItemIconButton>
							</WikiLandingRow>
						))}
					</HomeSection>
				)}
			</Stack>
		</Box>
	)
}
