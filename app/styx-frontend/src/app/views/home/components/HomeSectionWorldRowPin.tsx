import PushPin from '@mui/icons-material/PushPin'
import PushPinOutlined from '@mui/icons-material/PushPinOutlined'
import { useDispatch, useSelector } from 'react-redux'

import { WorldBrief } from '@/api/types/worldTypes'
import { preferencesSlice } from '@/app/features/preferences/PreferencesSlice'
import { getHomePreferences } from '@/app/features/preferences/PreferencesSliceSelectors'

import { HomeSectionRowIconButton } from './HomeSectionRowIconButton'

type Props = {
	world: WorldBrief
}

export function HomeSectionWorldRowPin({ world }: Props) {
	const { pinnedWorlds } = useSelector(getHomePreferences)
	const { toggleWorldPin } = preferencesSlice.actions
	const dispatch = useDispatch()

	const isPinned = pinnedWorlds.includes(world.id)

	return (
		<HomeSectionRowIconButton
			aria-label={`${isPinned ? 'Unpin' : 'Pin'} world "${world.name}"`}
			active={isPinned}
			onClick={() => dispatch(toggleWorldPin(world.id))}
		>
			{isPinned ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
		</HomeSectionRowIconButton>
	)
}
