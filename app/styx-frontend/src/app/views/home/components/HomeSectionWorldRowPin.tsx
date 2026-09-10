import PushPin from '@mui/icons-material/PushPin'
import PushPinOutlined from '@mui/icons-material/PushPinOutlined'

import { WorldBrief } from '@/api/types/worldTypes'

import { useToggleWorldPin } from '../../world/api/useToggleWorldPin'
import { HomeSectionRowIconButton } from './HomeSectionRowIconButton'

type Props = {
	world: WorldBrief
}

export function HomeSectionWorldRowPin({ world }: Props) {
	const isPinned = world.userPins.length > 0
	const [toggleWorldPin] = useToggleWorldPin()

	return (
		<HomeSectionRowIconButton
			aria-label={`${isPinned ? 'Unpin' : 'Pin'} world "${world.name}"`}
			active={isPinned}
			onClick={() => toggleWorldPin(world.id)}
		>
			{isPinned ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
		</HomeSectionRowIconButton>
	)
}
