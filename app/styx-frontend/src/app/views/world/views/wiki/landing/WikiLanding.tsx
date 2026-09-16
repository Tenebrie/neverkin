import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { alpha, useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'
import { useMobileLayout } from '@/app/hooks/useMobileLayout'
import { getWorldStateLoaded } from '@/app/views/world/WorldSliceSelectors'
import { ListSection } from '@/ui-lib/components/ListSection/ListSection'
import { ListSectionHeader } from '@/ui-lib/components/ListSection/ListSectionHeader'

import { useBoxedWikiContent } from '../hooks/useBoxedWikiContent'
import { useScreenCenteredColumn, WIKI_COLUMN_MAX_WIDTH } from '../hooks/useScreenCenteredColumn'
import { getWikiStateLoaded } from '../WikiSliceSelectors'
import { useRecentlyOpened } from './hooks/useRecentlyOpened'
import { WikiLandingLintList } from './lint/WikiLandingLintList'
import { WikiLandingEmptyState } from './WikiLandingEmptyState'
import { WikiLandingEntityRow } from './WikiLandingEntityRow'
import { WikiLandingHeader } from './WikiLandingHeader'
import { WikiLandingRecentlyChanged } from './WikiLandingRecentlyChanged'
import { WikiLandingResumeBanner } from './WikiLandingResumeBanner'

const MAX_ALSO_OPENED = 4

export function WikiLanding() {
	const isWorldLoaded = useSelector(getWorldStateLoaded)
	const isWikiLoaded = useSelector(getWikiStateLoaded)
	const { isMobile } = useMobileLayout()
	const { palette } = useTheme()
	const scrollbars = useBrowserSpecificScrollbars()
	const columnRef = useScreenCenteredColumn(!isMobile)

	const { visibleEntities, hiddenCount } = useBoxedWikiContent()
	const { entries } = useRecentlyOpened()

	const recentlyOpened = useMemo(() => {
		const entitiesById = new Map(visibleEntities.map((entity) => [entity.id, entity]))
		return entries.flatMap((entry) => {
			const entity = entitiesById.get(entry.entityId)
			return entity ? [{ entity, openedAt: entry.openedAt }] : []
		})
	}, [entries, visibleEntities])
	const shownRecentlyOpened = useMemo(() => recentlyOpened.slice(0, 1 + MAX_ALSO_OPENED), [recentlyOpened])
	const [lead, ...alsoOpened] = shownRecentlyOpened

	if (!isWorldLoaded || !isWikiLoaded) {
		return null
	}

	if (visibleEntities.length === 0 && hiddenCount === 0) {
		return <WikiLandingEmptyState />
	}

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
							<ListSectionHeader>Continue</ListSectionHeader>
						</Stack>
						<WikiLandingResumeBanner entity={lead.entity} openedAt={lead.openedAt} />
					</Stack>
				)}

				{alsoOpened.length > 0 && (
					<ListSection label="Also open recently" count={alsoOpened.length}>
						{alsoOpened.map(({ entity, openedAt }) => (
							<WikiLandingEntityRow key={entity.id} entity={entity} openedAt={openedAt} />
						))}
					</ListSection>
				)}

				<WikiLandingRecentlyChanged entities={visibleEntities} excluded={shownRecentlyOpened} />

				<WikiLandingLintList entities={visibleEntities} />
			</Stack>
		</Box>
	)
}
