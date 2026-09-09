import PushPin from '@mui/icons-material/PushPin'
import PushPinOutlined from '@mui/icons-material/PushPinOutlined'
import IconButton from '@mui/material/IconButton'
import { useDispatch, useSelector } from 'react-redux'

import { WorldBrief } from '@/api/types/worldTypes'
import { preferencesSlice } from '@/app/features/preferences/PreferencesSlice'
import { getHomePreferences } from '@/app/features/preferences/PreferencesSliceSelectors'
import { Tooltip } from '@/ui-lib/components/Tooltip'

type Props = {
	world: WorldBrief
}

export function HomeSectionWorldRowPin({ world }: Props) {
	const { pinnedWorlds } = useSelector(getHomePreferences)
	const { toggleWorldPin } = preferencesSlice.actions
	const dispatch = useDispatch()

	const isPinned = pinnedWorlds.includes(world.id)

	return (
		<Tooltip title={isPinned ? 'Unpin from top' : 'Pin to top'}>
			<IconButton
				size="small"
				aria-label={`${isPinned ? 'Unpin' : 'Pin'} world "${world.name}"`}
				onClick={(event) => {
					event.preventDefault()
					event.stopPropagation()
					dispatch(toggleWorldPin(world.id))
				}}
				sx={{
					color: isPinned ? 'primary.main' : 'text.disabled',
					'&:hover': { color: isPinned ? 'primary.main' : 'text.primary' },
				}}
			>
				{isPinned ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
			</IconButton>
		</Tooltip>
	)
}
