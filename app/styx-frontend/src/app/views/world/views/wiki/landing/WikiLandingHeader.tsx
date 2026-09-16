import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import { HomeRowItemTraitChip } from '@/app/views/home/components/rowItem/HomeRowItemTraitChip'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'

export function WikiLandingHeader() {
	const { name, description, isReadOnly } = useSelector(
		getWorldState,
		(a, b) => a.name === b.name && a.description === b.description && a.isReadOnly === b.isReadOnly,
	)

	return (
		<Stack component="header" gap={0.5}>
			<Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
				<Typography component="h1" variant="h5" fontWeight={600} letterSpacing="-0.02em">
					{name}
				</Typography>
				{isReadOnly && <HomeRowItemTraitChip label="Read-only" />}
			</Stack>
			{description && (
				<Typography variant="body2" color="text.secondary" sx={{ maxWidth: '60ch', textWrap: 'pretty' }}>
					{description}
				</Typography>
			)}
		</Stack>
	)
}
