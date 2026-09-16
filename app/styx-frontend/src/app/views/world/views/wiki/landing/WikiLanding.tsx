import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { alpha, useTheme } from '@mui/material/styles'
import { useSelector } from 'react-redux'

import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'
import { useMobileLayout } from '@/app/hooks/useMobileLayout'
import { getWorldStateLoaded } from '@/app/views/world/WorldSliceSelectors'

import { useBoxedWikiContent } from '../hooks/useBoxedWikiContent'
import { useScreenCenteredColumn, WIKI_COLUMN_MAX_WIDTH } from '../hooks/useScreenCenteredColumn'
import { getWikiStateLoaded } from '../WikiSliceSelectors'
import { WikiLandingLintList } from './lint/WikiLandingLintList'
import { WikiLandingEmptyState } from './WikiLandingEmptyState'
import { WikiLandingHeader } from './WikiLandingHeader'
import { WikiLandingRecentlyChanged } from './WikiLandingRecentlyChanged'
import { WikiLandingRecentlyOpened } from './WikiLandingRecentlyOpened'

export function WikiLanding() {
	const isWorldLoaded = useSelector(getWorldStateLoaded)
	const isWikiLoaded = useSelector(getWikiStateLoaded)
	const { isMobile } = useMobileLayout()
	const { palette } = useTheme()
	const scrollbars = useBrowserSpecificScrollbars()
	const columnRef = useScreenCenteredColumn(!isMobile)

	const { visibleEntities, hiddenCount } = useBoxedWikiContent()

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
					pb: '35vh',
				}}
			>
				<WikiLandingHeader />
				<WikiLandingRecentlyOpened entities={visibleEntities} />
				<WikiLandingRecentlyChanged entities={visibleEntities} />
				<WikiLandingLintList entities={visibleEntities} />
			</Stack>
		</Box>
	)
}
