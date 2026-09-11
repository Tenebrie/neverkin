import Box from '@mui/material/Box'

import { LoadingState } from '@/ui-lib/components/LoadingState'

import { HomeSection } from './HomeSection'

type Props = {
	label: string
}

export function HomeSectionLoadingState({ label }: Props) {
	return (
		<HomeSection label={label} count={0}>
			<Box sx={{ width: 1, height: 78 }}>
				<LoadingState />
			</Box>
		</HomeSection>
	)
}
