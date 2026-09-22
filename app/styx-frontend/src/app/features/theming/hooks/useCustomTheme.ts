import { PaletteMode } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useDebugValue } from 'react'
import { useStore } from 'react-redux'

import { RootState } from '@/app/store'

import { customDarkTheme, customLightTheme, darkTheme, lightTheme } from '../themes'

export type CustomTheme = ReturnType<typeof useCustomTheme>

let cachedReduceAnimations: boolean | null = null

export const useCustomTheme = () => {
	useDebugValue('useCustomTheme')
	const theme = useTheme()
	const store = useStore<RootState>()
	if (cachedReduceAnimations === null) {
		cachedReduceAnimations = store.getState().preferences.timeline.reduceAnimations
	}

	return getCustomTheme({ mode: theme.palette.mode, reduceAnimations: cachedReduceAnimations })
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
