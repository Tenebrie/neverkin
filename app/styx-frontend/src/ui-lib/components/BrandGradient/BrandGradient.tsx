import Box, { BoxProps } from '@mui/material/Box'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'

type Props = {
	variant?: 'text' | 'background'
} & BoxProps

export function BrandGradient({ variant = 'text', component = 'span', sx, ...rest }: Props) {
	const theme = useCustomTheme()

	return (
		<Box
			component={component}
			sx={[
				{
					backgroundImage: theme.custom.palette.brandGradient,
					...(variant === 'text' && { backgroundClip: 'text', color: 'transparent' }),
				},
				...(Array.isArray(sx) ? sx : [sx]),
			]}
			{...rest}
		/>
	)
}
