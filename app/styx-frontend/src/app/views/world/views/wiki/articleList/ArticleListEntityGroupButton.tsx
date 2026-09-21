import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { preferencesSlice } from '@/app/features/preferences/PreferencesSlice'
import { getWikiPreferences } from '@/app/features/preferences/PreferencesSliceSelectors'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'
import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

import { getWikiState } from '../WikiSliceSelectors'

export const ArticleListEntityGroupButton = memo(ArticleListEntityGroupButtonComponent)

function ArticleListEntityGroupButtonComponent() {
	const types = ['actor', 'article', 'event', 'tag'] satisfies (typeof visibleEntities)[number][]
	const typeLabels: Record<(typeof visibleEntities)[number], string> = {
		actor: 'Actors',
		article: 'Articles',
		event: 'Events',
		tag: 'Tags',
	}

	const { visibleEntities } = useSelector(
		getWikiPreferences,
		(a, b) => a.visibleEntities === b.visibleEntities,
	)
	const { articles } = useSelector(getWikiState, (a, b) => a.articles === b.articles)
	const { actors, events, tags } = useSelector(
		getWorldState,
		(a, b) => a.actors === b.actors && a.events === b.events && a.tags === b.tags,
	)
	const counts: Record<(typeof visibleEntities)[number], number> = {
		article: articles.length,
		actor: actors.length,
		event: events.length,
		tag: tags.length,
	}

	const { setVisibleWikiEntities } = preferencesSlice.actions
	const dispatch = useDispatch()

	function toggleEntity(type: (typeof visibleEntities)[number]) {
		if (visibleEntities.includes(type)) {
			dispatch(setVisibleWikiEntities(visibleEntities.filter((entity) => entity !== type)))
		} else {
			dispatch(setVisibleWikiEntities([...visibleEntities, type]))
		}
	}

	return (
		<Stack direction="row" alignItems="center" gap={0.5} flexWrap="nowrap" width={1}>
			{types.map((type) => {
				const isVisible = visibleEntities.includes(type)
				return (
					<Chip
						key={type}
						clickable
						variant="outlined"
						color={isVisible ? 'secondary' : 'secondary'}
						onClick={() => toggleEntity(type)}
						label={
							<Stack direction="row" alignItems="center" gap={0.5}>
								<EntityIcon variant={type} height={16} />
								<Box
									component="span"
									sx={{ '@container outliner-drawer (width < 400px)': { display: 'none' } }}
								>
									{typeLabels[type]}
								</Box>
								<Box
									component="span"
									sx={{
										borderRadius: '999px',
										padding: '0 5px',
										fontSize: '0.7rem',
										fontWeight: 600,
										bgcolor: 'secondary.main',
										color: 'secondary.contrastText',
									}}
								>
									{counts[type]}
								</Box>
							</Stack>
						}
						sx={(theme) => ({
							borderRadius: 0.75,
							flexGrow: 1,
							opacity: isVisible ? 1 : 0.5,
							transition:
								'background-color 0.4s ease-out, box-shadow 0.4s ease-out, opacity 0.2s ease-out !important',
							backgroundColor: isVisible ? alpha(theme.palette.secondary.main, 0.15) : 'none',
							justifyContent: 'center',
							'& .MuiChip-label': { paddingLeft: 0.5, paddingRight: 0.5 },
							...(isVisible
								? { backgroundColor: alpha(theme.palette.secondary.main, 0.15) }
								: {
										// borderColor: alpha(theme.palette.secondary.main, 0.1),
										// color: alpha(theme.palette.secondary.main, 0.5),
									}),
						})}
					/>
				)
			})}
		</Stack>
	)
}
