import { PaletteMode } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useDebugValue } from 'react'
import { useSelector } from 'react-redux'

import { getTimelinePreferences } from '../../preferences/PreferencesSliceSelectors'
import { customDarkTheme, customLightTheme, darkTheme, lightTheme } from '../themes'

export type CustomTheme = ReturnType<typeof useCustomTheme>

export const useCustomTheme = () => {
	useDebugValue('useCustomTheme')
	const theme = useTheme()
	const { reduceAnimations } = useSelector(
		getTimelinePreferences,
		(a, b) => a.reduceAnimations === b.reduceAnimations,
	)

	return getCustomTheme({ mode: theme.palette.mode, reduceAnimations })
}

type Props = {
	mode: PaletteMode
	reduceAnimations: boolean
}

const themeCache = new Map<string, ReturnType<typeof buildCustomTheme>>()

export const getCustomTheme = (props: Props) => {
	const key = `${props.mode}-${props.reduceAnimations}`
	const cachedTheme = themeCache.get(key)
	if (cachedTheme) {
		return cachedTheme
	}

	const theme = buildCustomTheme(props)
	themeCache.set(key, theme)
	return theme
}

const buildCustomTheme = ({ mode, reduceAnimations }: Props) => ({
	mode,
	material: mode === 'light' ? lightTheme({ reduceAnimations }) : darkTheme({ reduceAnimations }),
	custom: mode === 'light' ? customLightTheme : customDarkTheme,
	customInverted: mode === 'light' ? customDarkTheme : customLightTheme,
})
