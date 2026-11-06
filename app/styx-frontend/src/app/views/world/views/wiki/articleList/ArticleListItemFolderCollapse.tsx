import Stack from '@mui/material/Stack'
import { useSelector } from 'react-redux'

import { ShowHideChevron } from '@/app/components/ShowHideChevron'
import { getWikiPreferences } from '@/app/features/preferences/PreferencesSliceSelectors'

type Props = {
	id: string
}

export function ArticleListItemFolderCollapse({ id }: Props) {
	const { expandedFolders } = useSelector(
		getWikiPreferences,
		(a, b) => a.expandedFolders === b.expandedFolders,
	)

	const collapsed = !expandedFolders.includes(id)

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="center"
			sx={{
				marginLeft: -0.5,
				marginRight: 0,
			}}
		>
			<ShowHideChevron collapsed={collapsed} />
		</Stack>
	)
}
