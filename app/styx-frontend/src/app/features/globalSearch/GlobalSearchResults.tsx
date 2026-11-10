import Public from '@mui/icons-material/Public'
import Box from '@mui/material/Box'
import MenuList from '@mui/material/MenuList'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import { GlobalSearchHit } from '@/api/types/searchTypes'
import { useGetWorldsQuery } from '@/api/worldListApi'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

import { GlobalSearchHit as SearchHitComponent } from './GlobalSearchHit'

export type Props = {
	hits: GlobalSearchHit[]
} & Omit<Parameters<typeof SearchHitComponent>[0], 'hit'>

export function GlobalSearchResults({ hits, ...hitProps }: Props) {
	const currentWorldId = useSelector(getWorldIdState)
	const { data: worldList } = useGetWorldsQuery()
	const worlds = [
		...(worldList?.ownedWorlds ?? []),
		...(worldList?.contributableWorlds ?? []),
		...(worldList?.visibleWorlds ?? []),
	]

	const worldIds = new Set<string>()
	if (hits.some((hit) => hit.worldId === currentWorldId)) {
		worldIds.add(currentWorldId)
	}
	for (const hit of hits) {
		worldIds.add(hit.worldId)
	}

	return (
		<MenuList sx={{ padding: '7px 8px 9px' }}>
			{[...worldIds].map((worldId) => (
				<Box key={worldId}>
					<Stack
						direction="row"
						alignItems="center"
						gap={1}
						sx={{ paddingX: '11px', paddingTop: 1, paddingBottom: 0.5 }}
					>
						<Public sx={{ fontSize: 14, color: 'text.disabled' }} />
						<Typography
							variant="caption"
							sx={{
								color: 'text.disabled',
								fontWeight: 700,
								letterSpacing: '0.1em',
								textTransform: 'uppercase',
								minWidth: 0,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{worlds.find((world) => world.id === worldId)?.name}
						</Typography>
						{worldId === currentWorldId && (
							<Typography
								variant="caption"
								sx={{
									fontSize: '0.6rem',
									fontWeight: 700,
									letterSpacing: '0.1em',
									textTransform: 'uppercase',
									flexShrink: 0,
									paddingX: 0.5,
									borderRadius: 0.5,
									color: 'primary.light',
									backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
								}}
							>
								current
							</Typography>
						)}
					</Stack>
					{hits
						.filter((hit) => hit.worldId === worldId)
						.map((hit) => (
							<Box key={hit.id}>
								<SearchHitComponent hit={hit} {...hitProps} />
								<Box sx={{ paddingLeft: 1 }}>
									{hit.pages.map((page) => (
										<SearchHitComponent key={page.pageId} hit={page} {...hitProps} />
									))}
								</Box>
							</Box>
						))}
				</Box>
			))}
		</MenuList>
	)
}
