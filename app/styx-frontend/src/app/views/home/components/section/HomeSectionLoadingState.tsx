import Box from '@mui/material/Box'

import { ListSection } from '@/ui-lib/components/ListSection/ListSection'
import { LoadingState } from '@/ui-lib/components/LoadingState'

type Props = {
	label: string
}

export function HomeSectionLoadingState({ label }: Props) {
	return (
		<ListSection label={label} count={0}>
			<Box sx={{ width: 1, height: 78 }}>
				<LoadingState />
			</Box>
		</ListSection>
	)
}
