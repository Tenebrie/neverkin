import Stack from '@mui/material/Stack'

import { ListSection } from '@/ui-lib/components/ListSection/ListSection'
import { ListSectionHeader } from '@/ui-lib/components/ListSection/ListSectionHeader'

import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { useRecentlyOpenedEntities } from './hooks/useRecentlyOpenedEntities'
import { WikiLandingEntityRow } from './WikiLandingEntityRow'
import { WikiLandingResumeBanner } from './WikiLandingResumeBanner'

type Props = {
	entities: BoxedWikiEntity[]
}

export function WikiLandingRecentlyOpened({ entities }: Props) {
	const { lead, alsoOpened } = useRecentlyOpenedEntities(entities)

	if (!lead) {
		return null
	}

	return (
		<>
			<Stack gap={1.5}>
				<Stack direction="row" alignItems="center" sx={{ px: 0.25, minHeight: 34 }}>
					<ListSectionHeader>Continue</ListSectionHeader>
				</Stack>
				<WikiLandingResumeBanner entity={lead.entity} openedAt={lead.openedAt} />
			</Stack>

			{alsoOpened.length > 0 && (
				<ListSection label="Also open recently" count={alsoOpened.length}>
					{alsoOpened.map(({ entity, openedAt }) => (
						<WikiLandingEntityRow key={entity.id} entity={entity} openedAt={openedAt} />
					))}
				</ListSection>
			)}
		</>
	)
}
