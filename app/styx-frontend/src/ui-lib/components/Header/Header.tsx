import Stack from '@mui/material/Stack'
import Typography, { TypographyProps } from '@mui/material/Typography'
import { ReactNode } from 'react'

type HeaderVariant = keyof typeof variantDefaults

type Props = {
	variant: HeaderVariant
	icon?: ReactNode
	endAdornment?: ReactNode
} & Omit<TypographyProps, 'variant'>

const variantDefaults = {
	h1: {
		typographyVariant: 'h5',
		sx: { fontFamily: 'Inter', fontWeight: 500 },
	},
	h2: {
		typographyVariant: 'h6',
		sx: { display: 'flex', fontFamily: 'Inter', alignItems: 'center', gap: 1, fontSize: 18 },
	},
	h3: {
		typographyVariant: 'h6',
		sx: { display: 'flex', fontFamily: 'Inter', alignItems: 'center', gap: 1, fontSize: 14 },
	},
} as const

export function Header({ variant, icon, sx, children, endAdornment, ...rest }: Props) {
	const defaults = variantDefaults[variant]

	return (
		<Typography variant={defaults.typographyVariant} sx={{ ...defaults.sx, ...sx }} {...rest}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ width: 1 }}>
				<span style={{ flex: 1 }}>
					{icon} {children}
				</span>
				{endAdornment}
			</Stack>
		</Typography>
	)
}
