import Stack from '@mui/material/Stack'
import { useEffect, useMemo } from 'react'

import { RegisteredShortcuts, Shortcut, ShortcutPriorities, ShortcutPriority } from './useShortcutManager'

export { Shortcut, ShortcutPriorities }

export const useShortcut = (
	shortcutOrArray:
		| (typeof Shortcut)[keyof typeof Shortcut]
		| (typeof Shortcut)[keyof typeof Shortcut][]
		| undefined,
	callback: () => void,
	priority?: ShortcutPriority,
) => {
	useEffect(() => {
		if (priority === -1 || priority === false || shortcutOrArray === undefined) {
			return
		}

		const shortcuts = Array.isArray(shortcutOrArray) ? shortcutOrArray : [shortcutOrArray]
		const getActualPriority = (shortcut: (typeof Shortcut)[keyof typeof Shortcut]) => {
			if (priority === undefined) {
				return 0
			}
			if (priority === true) {
				return 1
			}
			if (priority <= 1) {
				return priority
			}

			function isPriorityTaken(value: number) {
				return RegisteredShortcuts[shortcut].some((registered) => registered.priority === value)
			}

			let currentValue = priority
			while (isPriorityTaken(currentValue)) {
				currentValue += 0.01
			}
			return currentValue
		}

		shortcuts.forEach((shortcut) => {
			RegisteredShortcuts[shortcut].push({
				callback,
				priority: getActualPriority(shortcut),
			})
		})
		return () => {
			shortcuts.forEach((shortcut) => {
				RegisteredShortcuts[shortcut] = RegisteredShortcuts[shortcut].filter((cb) => cb.callback !== callback)
			})
		}
	}, [callback, priority, shortcutOrArray])

	const label = useMemo(() => {
		const shortcuts = Array.isArray(shortcutOrArray) ? shortcutOrArray : [shortcutOrArray]
		return shortcuts.join(' / ')
	}, [shortcutOrArray])

	const largeLabel = useMemo(() => {
		const shortcuts = Array.isArray(shortcutOrArray) ? shortcutOrArray : [shortcutOrArray]
		return shortcuts.map((shortcut) => (
			<Stack sx={{ alignItems: 'center', justifyContent: 'center', fontSize: '12px' }} key={shortcut}>
				{shortcut}
			</Stack>
		))
	}, [shortcutOrArray])

	return {
		label,
		largeLabel,
	}
}
