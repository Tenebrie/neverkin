import { PaletteMode } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { JSX } from 'react'
import { useSelector } from 'react-redux'

import { getTimelinePreferences, getUserPreferences } from '../../preferences/PreferencesSliceSelectors'
import { getCustomTheme } from '../hooks/useCustomTheme'

type Props = {
	children: JSX.Element | (JSX.Element | null)[] | null
	colorMode?: PaletteMode
}

export const CustomThemeProvider = ({ children, colorMode }: Props) => {
	return (
		<>
			{colorMode ? (
				<ManualThemeProvider colorMode={colorMode}>{children}</ManualThemeProvider>
			) : (
				<AutomaticThemeProvider>{children}</AutomaticThemeProvider>
			)}
		</>
	)
}

const AutomaticThemeProvider = ({ children }: Props) => {
	const { colorMode } = useSelector(getUserPreferences, (a, b) => a.colorMode === b.colorMode)

	return <ManualThemeProvider colorMode={colorMode}>{children}</ManualThemeProvider>
}

const ManualThemeProvider = ({ children, colorMode }: Props & { colorMode: PaletteMode }) => {
	const { reduceAnimations } = useSelector(
		getTimelinePreferences,
		(a, b) => a.reduceAnimations === b.reduceAnimations,
	)
	const theme = getCustomTheme({ mode: colorMode, reduceAnimations }).material

	return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
