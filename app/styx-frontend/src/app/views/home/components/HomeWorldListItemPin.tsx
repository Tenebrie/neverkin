import PushPin from '@mui/icons-material/PushPin'
import PushPinOutlined from '@mui/icons-material/PushPinOutlined'

import { WorldBrief } from '@/api/types/worldTypes'

import { useToggleWorldPin } from '../../world/api/useToggleWorldPin'
import { HomeRowItemIconButton } from './rowItem/HomeRowItemIconButton'

type Props = {
	world: WorldBrief
}

export function HomeWorldListItemPin({ world }: Props) {
	const isPinned = world.userPins.length > 0
	const [toggleWorldPin] = useToggleWorldPin()

	return (
		<HomeRowItemIconButton
			aria-label={`${isPinned ? 'Unpin' : 'Pin'} world "${world.name}"`}
			active={isPinned}
			onClick={() => toggleWorldPin(world.id)}
		>
			{isPinned ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
		</HomeRowItemIconButton>
	)
}
