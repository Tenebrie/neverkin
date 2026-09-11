import { SxProps } from '@mui/material'
import Avatar from '@mui/material/Avatar'
import { useMemo } from 'react'

import { Actor } from '@/api/types/worldTypes'
import { getContrastTextColor } from '@/app/utils/colors/getContrastTextColor'
import { useColorUtils } from '@/app/utils/colors/useColorUtils'
import { getInitials } from '@/app/utils/getInitials'

type Props = {
	actor: Actor
	sx?: SxProps
	fontSize?: number | string
	surroundingColor?: string
}

export const ActorAvatar = ({ actor, sx, fontSize, surroundingColor }: Props) => {
	const { adaptColor } = useColorUtils()
	const color = useMemo(() => {
		if (!actor.color) {
			return '#000000'
		}
		if (!surroundingColor) {
			return actor.color
		}

		return adaptColor(actor.color, surroundingColor)
	}, [actor.color, adaptColor, surroundingColor])

	return (
		<Avatar sx={{ ...sx, color: getContrastTextColor(color), bgcolor: color }} style={{ fontSize }}>
			{getInitials(actor.name)}
		</Avatar>
	)
}
