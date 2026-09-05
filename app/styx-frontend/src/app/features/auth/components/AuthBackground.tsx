import { Icon } from '@iconify/react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import GlobalStyles from '@mui/material/GlobalStyles'
import { useTheme } from '@mui/material/styles'
import { useRouterState } from '@tanstack/react-router'
import { type ReactNode, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getGlobalPreferences } from '@/app/features/preferences/PreferencesSliceSelectors'

import { preferencesSlice } from '../../preferences/PreferencesSlice'

/**
 * We register custom properties so the browser can interpolate percentage values
 * used inside the radial-gradient. Without this, gradient changes would snap.
 */
const propertyRegistrations = `
	@property --purple-x {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 25%;
	}
	@property --purple-y {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 15%;
	}
	@property --red-x {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 75%;
	}
	@property --red-y {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 85%;
	}
	@property --purple-alpha {
		syntax: '<number>';
		inherits: false;
		initial-value: 0.22;
	}
	@property --red-alpha {
		syntax: '<number>';
		inherits: false;
		initial-value: 0.22;
	}
	@property --pink-x {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 50%;
	}
	@property --pink-y {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 50%;
	}
	@property --pink-alpha {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
	}
`

type GradientVariation = {
	purpleX: string
	purpleY: string
	redX: string
	redY: string
	pinkX?: string
	pinkY?: string
	pink?: boolean
	visible: boolean
}

const variations: Record<string, GradientVariation> = {
	home: { purpleX: '10%', purpleY: '15%', redX: '90%', redY: '85%', visible: true },
	login: { purpleX: '25%', purpleY: '15%', redX: '75%', redY: '85%', visible: true },
	createAccount: { purpleX: '75%', purpleY: '15%', redX: '25%', redY: '85%', visible: true },
	worldList: { purpleX: '15%', purpleY: '55%', redX: '85%', redY: '45%', visible: true },
	calendar: { purpleX: '45%', purpleY: '25%', redX: '65%', redY: '85%', visible: true },
	profile: { purpleX: '10%', purpleY: '90%', redX: '90%', redY: '30%', visible: true },
	tools: { purpleX: '85%', purpleY: '50%', redX: '15%', redY: '50%', visible: true },
	admin: {
		purpleX: '100%',
		purpleY: '80%',
		redX: '45%',
		redY: '25%',
		pinkX: '15%',
		pinkY: '80%',
		pink: true,
		visible: true,
	},
	hidden: { purpleX: '50%', purpleY: '50%', redX: '50%', redY: '50%', visible: false },
}

function getVariation(pathname: string): GradientVariation {
	if (pathname === '/') return variations.home
	if (pathname.includes('login')) return variations.login
	if (pathname.includes('create-account')) return variations.createAccount
	if (pathname.startsWith('/admin')) return variations.admin
	if (pathname === '/world') return variations.worldList
	if (pathname === '/calendar') return variations.calendar
	if (pathname.startsWith('/profile')) return variations.profile
	if (pathname.startsWith('/tools')) return variations.tools
	return variations.hidden
}

type Props = {
	children: ReactNode
}

export function AuthBackground({ children }: Props) {
	const { animatedBackground, showDiscordLink } = useSelector(
		getGlobalPreferences,
		(a, b) => a.animatedBackground === b.animatedBackground && a.showDiscordLink === b.showDiscordLink,
	)
	const pathname = useRouterState({ select: (s) => s.location.pathname })
	const theme = useTheme()
	const isLight = theme.palette.mode === 'light'

	const { setShowDiscordLink } = preferencesSlice.actions
	const dispatch = useDispatch()

	const variation = useMemo(() => getVariation(pathname), [pathname])

	const purpleAlpha = isLight ? 0.35 : 0.22
	const redAlpha = isLight ? 0.35 : 0.22
	const pinkAlpha = isLight ? 0.4 : 0.25
	const baseBg = isLight ? '#f5f3fa' : '#0c0a14'

	if (!animatedBackground) {
		return <>{children}</>
	}

	return (
		<>
			<GlobalStyles styles={propertyRegistrations} />
			<Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
				{/* Hidden SVG defining the noise texture used by the dither overlay */}
				<svg style={{ position: 'absolute', width: 0, height: 0 }}>
					<filter id="bg-noise">
						<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" stitchTiles="stitch" />
					</filter>
				</svg>
				<Box
					sx={{
						position: 'fixed',
						inset: 0,
						pointerEvents: 'none',
						'--purple-x': variation.purpleX,
						'--purple-y': variation.purpleY,
						'--red-x': variation.redX,
						'--red-y': variation.redY,
						'--pink-x': variation.pinkX ?? '50%',
						'--pink-y': variation.pinkY ?? '50%',
						'--purple-alpha': variation.visible ? purpleAlpha : 0,
						'--red-alpha': variation.visible ? redAlpha : 0,
						'--pink-alpha': variation.pink ? pinkAlpha : 0,
						background: `
							radial-gradient(ellipse at var(--pink-x) var(--pink-y), rgba(219,39,119,var(--pink-alpha)), transparent 55%),
							radial-gradient(ellipse at var(--purple-x) var(--purple-y), rgba(123,77,240,var(--purple-alpha)), transparent 55%),
							radial-gradient(ellipse at var(--red-x) var(--red-y), rgba(156,62,78,var(--red-alpha)), transparent 55%),
							${baseBg}`,
						transition:
							'--purple-x 0.8s ease, --purple-y 0.8s ease, --red-x 0.8s ease, --red-y 0.8s ease, --pink-x 0.8s ease, --pink-y 0.8s ease, --purple-alpha 0.8s ease, --red-alpha 0.8s ease, --pink-alpha 0.8s ease',
					}}
				/>
				{/* Subtle noise overlay to dither away gradient banding */}
				<Box
					sx={{
						position: 'fixed',
						inset: 0,
						filter: 'url(#bg-noise)',
						opacity: 0.06,
						pointerEvents: 'none',
					}}
				/>
				<Box sx={{ position: 'relative', height: '100%' }}>{children}</Box>
				{variation.visible && showDiscordLink && (
					<Button
						component="a"
						href="https://discord.gg/rD3KdXmqDP"
						onClick={() => {
							dispatch(setShowDiscordLink(false))
						}}
						target="_blank"
						rel="noopener noreferrer"
						startIcon={<Icon icon="tabler:brand-discord" width={20} />}
						size="small"
						sx={{
							position: 'fixed',
							bottom: 8,
							right: 16,
							textTransform: 'none',
							color: 'text.secondary',
							opacity: 0.6,
							px: 1,
							transition: 'opacity 0.2s ease',
							'&:hover': {
								opacity: 1,
							},
						}}
					>
						Discord
					</Button>
				)}
			</Box>
		</>
	)
}
