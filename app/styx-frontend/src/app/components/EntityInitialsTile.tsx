import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'

import { getInitials } from '@/app/utils/getInitials'

type Props = {
	name: string
	color: string
	icon?: ReactNode
}

/**
 * Square tile standing in for an entity, tinted with its accent color. Shows the entity's initials
 * unless an icon is given.
 */
export function EntityInitialsTile({ name, color, icon }: Props) {
	const { palette } = useTheme()
	const isDark = palette.mode === 'dark'

	return (
		<Box
			sx={{
				width: 38,
				height: 38,
				flex: '0 0 auto',
				borderRadius: 1.25,
				display: 'grid',
				placeItems: 'center',
				typography: 'caption',
				fontWeight: 'bold',
				background: isDark
					? `color-mix(in oklab, ${color} 18%, transparent)`
					: `color-mix(in oklab, ${color} 15%, white)`,
				color: isDark
					? `color-mix(in oklab, ${color} 82%, white)`
					: `color-mix(in oklab, ${color} 38%, black)`,
			}}
		>
			{icon ?? getInitials(name)}
		</Box>
	)
}
