import { createTheme, Theme, ThemeOptions } from '@mui/material/styles'

const commonTheme = createTheme()

type Props = {
	reduceAnimations: boolean
}

const baseThemeOptions = ({ reduceAnimations }: Props): ThemeOptions => ({
	shape: {
		borderRadius: 8,
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
				},
				contained: {
					boxShadow: 'none',
					'&:active': {
						boxShadow: 'none',
					},
				},
			},
		},
		MuiTabs: {
			styleOverrides: {
				indicator: {
					height: 3,
					borderTopLeftRadius: 3,
					borderTopRightRadius: 3,
					backgroundColor: commonTheme.palette.common.white,
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					marginLeft: 0,
					marginRight: commonTheme.spacing(2),
					minWidth: commonTheme.spacing(5),
					padding: 0,
					[commonTheme.breakpoints.up('md')]: {
						padding: '0 8px',
					},
				},
			},
		},
		MuiIconButton: {
			styleOverrides: {
				root: {
					padding: commonTheme.spacing(1),
					'&:hover': {
						transition: 'none !important',
					},
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					borderRadius: 4,
				},
			},
		},
		MuiDivider: {
			styleOverrides: {},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					'& .MuiOutlinedInput-notchedOutline': {
						transition: 'border-color 0.2s ease',
					},
				},
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					'&.Mui-selected': {
						color: '#4fc3f7',
					},
				},
			},
		},
		MuiListItemText: {
			styleOverrides: {
				primary: {
					fontSize: 14,
					fontWeight: commonTheme.typography.fontWeightMedium,
				},
			},
		},
		MuiListItemIcon: {
			styleOverrides: {
				root: {
					color: 'inherit',
					minWidth: 'auto',
					marginRight: commonTheme.spacing(2),
					'& svg': {
						fontSize: 20,
					},
				},
			},
		},
		MuiPopover: {
			defaultProps: {
				disableEnforceFocus: true,
			},
			styleOverrides: {
				paper: {
					...(reduceAnimations
						? {
								transition: 'none !important',
								animation: 'none !important',
							}
						: {}),
					willChange: 'transform',
				},
				root: ({ ownerState }) => ({
					pointerEvents: ownerState.open ? 'auto' : 'none',
				}),
			},
		},
		MuiMenu: {
			styleOverrides: {
				paper: {
					...(reduceAnimations
						? {
								transition: 'none !important',
								animation: 'none !important',
							}
						: {}),
					willChange: 'transform',
				},
				root: ({ ownerState }) => ({
					pointerEvents: ownerState.open ? 'auto' : 'none',
				}),
			},
		},
	},
})

export const customLightTheme = {
	palette: {
		timelineAnchor: {
			text: 'rgb(21, 16, 11)',
		},
		outline: 'rgb(60 40 120 / 18%)',
		outlineStrong: 'rgb(60 40 120 / 40%)',
		hintText: 'rgb(0 0 0 / 60%)',
		highlight: 'hsla(31, 100%, 50%, 1.00)',
		brandGradient: 'linear-gradient(135deg, #b8860b 0%, #c56030 33%, #b4574b 66%, #9c3e4e 100%)',
		neutralBackground: {
			contrastText: 'rgb(0 0 0 / 38%)',
			normal: 'rgb(0 0 0 / 20%)',
			hard: 'rgb(0 0 0  / 50%)',
			harder: 'rgb(0 0 0 / 65%)',
			hardest: 'rgb(0 0 0  / 80%)',
			soft: 'rgb(0 0 0  / 8%)',
			softer: 'rgb(0 0 0 / 4%)',
			softest: 'rgb(0 0 0 / 2%)',
		},
		background: {
			hard: 'rgb(60 40 120 / 30%)',
			harder: 'rgb(60 40 120 / 40%)',
			hardest: 'rgb(60 40 120 / 60%)',
			soft: 'rgb(60 40 120 / 8%)',
			softer: 'rgb(60 40 120 / 4%)',
			softest: 'rgb(60 40 120 / 2%)',
			textEditor: '#fff',
			timeline: '#eae9f2',
			timelineHeader: 'hsl(250, 20%, 93%)',
			navigator: '#fff',
			timelineMarker: '#fff',
			timelineMarkerTail: 'hsl(250, 15%, 82%)',
		},
	},
}

export const customDarkTheme: typeof customLightTheme = {
	palette: {
		timelineAnchor: {
			text: 'white',
		},
		outline: 'rgb(180 170 220 / 18%)',
		outlineStrong: 'rgb(180 170 220 / 40%)',
		hintText: 'rgb(255 255 255 / 50%)',
		highlight: 'hsla(31, 100%, 50%, 1.00)',
		brandGradient: 'linear-gradient(135deg, #f2edb6 0%, #f8c569 33%, #ce7259 66%, #9c3e4e 100%)',
		neutralBackground: {
			contrastText: 'rgb(255, 255, 255, 38%)',
			normal: 'rgb(255 255 255 / 10%)',
			hard: 'rgb(255 255 255 / 30%)',
			harder: 'rgb(255 255 255 / 40%)',
			hardest: 'rgb(255 255 255 / 60%)',
			soft: 'rgb(255 255 255 / 8%)',
			softer: 'rgb(255 255 255 / 4%)',
			softest: 'rgb(255 255 255 / 2%)',
		},
		background: {
			hard: 'rgb(180 170 220 / 30%)',
			harder: 'rgb(180 170 220 / 40%)',
			hardest: 'rgb(180 170 220 / 60%)',
			soft: 'rgb(180 170 220 / 8%)',
			softer: 'rgb(180 170 220 / 4%)',
			softest: 'rgb(180 170 220 / 2%)',
			textEditor: 'hsl(252, 25%, 14%)',
			timeline: '#0f0e1a',
			timelineHeader: '#16142a',
			navigator: '#16142a',
			timelineMarker: '#0f0e1a',
			timelineMarkerTail: 'hsl(252, 20%, 28%)',
		},
	},
}

export const lightTheme = (props: Props): Theme => {
	const base = baseThemeOptions(props)
	const options: ThemeOptions = {
		...base,
		components: {
			...base.components,
			MuiButton: {
				styleOverrides: {
					...(base.components?.MuiButton?.styleOverrides ?? {}),
					containedPrimary: {
						backgroundColor: 'hsl(258, 100%, 70%)',
						'&:hover': {
							backgroundColor: 'hsl(258, 100%, 75%)',
						},
					},
				},
			},
		},
		palette: {
			mode: 'light',
			background: {
				paper: '#fff',
				default: 'hsl(250, 25%, 93%)',
			},
			primary: {
				main: 'hsl(258, 45%, 48%)',
				contrastText: '#fff',
			},
			secondary: {
				main: 'hsl(200, 50%, 42%)',
				contrastText: '#fff',
			},
			error: {
				main: '#9d0000',
				contrastText: '#fff',
			},
		},
	}

	return createTheme(options)
}

export const darkTheme = (props: Props): Theme => {
	const base = baseThemeOptions(props)
	const options: ThemeOptions = {
		...base,
		components: {
			...base.components,
			MuiOutlinedInput: {
				styleOverrides: {
					...((base.components?.MuiOutlinedInput?.styleOverrides as Record<string, unknown>) ?? {}),
					root: {
						...((base.components?.MuiOutlinedInput?.styleOverrides as Record<string, unknown>)?.root ?? {}),
						'&:hover:not(.Mui-focused):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
							borderColor: 'hsla(31, 100%, 50%, 1.00)',
						},
					},
				},
			},
			MuiButton: {
				styleOverrides: {
					...(base.components?.MuiButton?.styleOverrides ?? {}),
					containedPrimary: ({ theme }) => ({
						backgroundColor: theme.palette.primary.dark,
						color: '#f0ecff',
						'&:hover': {
							backgroundColor: 'hsl(258, 52%, 46%)',
						},
					}),
					containedSecondary: {
						backgroundColor: 'hsl(200, 55%, 25%)',
						color: '#f0ecff',
						'&:hover': {
							backgroundColor: 'hsl(200, 55%, 30%)',
						},
					},
				},
			},
		},
		palette: {
			mode: 'dark',
			background: {
				default: '#0f0e1a',
				paper: 'hsl(252, 25%, 14%)',
			},
			primary: {
				main: '#9f7eed',
				// Contained primary buttons are painted with this (see MuiButton styleOverrides)
				dark: 'hsl(258, 50%, 38%)',
				contrastText: '#f0ecff',
				// TODO: Explore orange primary
				// main: 'hsla(31, 100%, 50%, 1.00)',
				// contrastText: '#000000ff',
			},
			secondary: {
				main: 'hsl(200, 55%, 55%)',
				contrastText: '#0f0e1a',
			},
			error: {
				main: '#f07070',
				contrastText: '#0f0e1a',
			},
		},
	}

	return createTheme(options)
}
