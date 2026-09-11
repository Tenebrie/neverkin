import Public from '@mui/icons-material/Public'
import { useMemo } from 'react'

import { pinnedWorldFirst } from '@/app/utils/sorting/pinnedWorldFirst'
import { recentFirst } from '@/app/utils/sorting/recentFirst'
import { sortPipe } from '@/app/utils/sorting/sortPipe'

import { WorldListCreateNewButton } from '../../worldManagement/components/WorldList/WorldListCreateNewButton'
import { useWorldListData } from '../../worldManagement/hooks/useWorldListData'
import { HomeWorldListItem } from './HomeWorldListItem'
import { HomeSection } from './section/HomeSection'
import { HomeSectionEmptyState } from './section/HomeSectionEmptyState'
import { HomeSectionLoadingState } from './section/HomeSectionLoadingState'

export function HomeWorldList() {
	const { isLoading } = useWorldListData()
	if (isLoading) {
		return <HomeSectionLoadingState label="Your worlds" />
	}

	return (
		<>
			<OwnedWorldList />
			<SharedWorldList />
		</>
	)
}

function OwnedWorldList() {
	const { ownedWorlds } = useWorldListData()

	const sortedWorlds = useMemo(() => {
		return [...ownedWorlds].sort(sortPipe(pinnedWorldFirst, recentFirst))
	}, [ownedWorlds])

	if (ownedWorlds.length === 0) {
		return (
			<HomeSectionEmptyState
				icon={<Public />}
				title="Your worlds"
				cta="Start a world of your own"
				description="A world holds your wiki, timeline and mindmap. You can invite others later."
				action={<WorldListCreateNewButton variant="labelled" label="Get started" />}
			/>
		)
	}

	return (
		<HomeSection label="Your worlds" count={ownedWorlds.length}>
			{sortedWorlds.map((world) => (
				<HomeWorldListItem key={world.id} world={world} owned />
			))}
		</HomeSection>
	)
}

function SharedWorldList() {
	const { contributableWorlds, visibleWorlds } = useWorldListData()

	const sortedWorlds = useMemo(() => {
		return [...contributableWorlds, ...visibleWorlds].sort(sortPipe(pinnedWorldFirst, recentFirst))
	}, [contributableWorlds, visibleWorlds])

	if (sortedWorlds.length === 0) {
		return null
	}

	return (
		<HomeSection label="Shared with you" count={sortedWorlds.length}>
			{sortedWorlds.map((world) => (
				<HomeWorldListItem
					key={world.id}
					world={world}
					readonly={visibleWorlds.some((w) => w.id === world.id)}
				/>
			))}
		</HomeSection>
	)
}
