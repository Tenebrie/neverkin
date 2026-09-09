import { z } from 'zod'

import { ScaleLevelSchema } from '@/app/schema/ScaleLevel'

import { CalendarUnitEditorTab } from '../../time/calendar/types'

export const PreferencesKey = 'userPreferences/v2'

const defaultTheme = ((): 'light' | 'dark' => {
	if (window.matchMedia) {
		const query = window.matchMedia('(prefers-color-scheme:dark)')
		return query.matches ? 'dark' : 'light'
	}
	return 'light'
})()

export const PreferencesStateSchema = z.object({
	admin: z
		.object({
			notificationTitle: z.string().default(''),
			notificationDescription: z.string().default(''),
		})
		.default({}),
	calendarEditor: z
		.object({
			expandedUnitSections: z.array(z.nativeEnum(CalendarUnitEditorTab)).default([]),
		})
		.default({}),
	colorMode: z.union([z.literal('light'), z.literal('dark')]).default(defaultTheme),
	global: z
		.object({
			animatedBackground: z.boolean().default(true),
			showDiscordLink: z.boolean().default(true),
		})
		.default({}),
	home: z
		.object({
			// TODO: Move pins and the last opened world onto the user record so they follow the account across devices.
			pinnedWorlds: z.array(z.string()).default([]),
			lastOpenedWorldId: z.string().nullable().default(null),
		})
		.default({}),
	iconSets: z
		.object({
			recent: z.array(z.string()).default([]),
		})
		.default({}),
	outliner: z
		.object({
			tabIndex: z.number().default(0),
			showInactiveStatements: z.boolean().default(false),
			expandedActors: z.array(z.string()).default([]),
			expandedEvents: z.array(z.string()).default([]),
			expandedTags: z.array(z.string()).default([]),
		})
		.default({}),
	overview: z
		.object({
			actorsOpen: z.boolean().default(true),
			actorsReversed: z.boolean().default(false),
			eventsOpen: z.boolean().default(true),
			eventsReversed: z.boolean().default(false),
		})
		.default({}),
	timeline: z
		.object({
			containerHeight: z.number().default(232),
			scaleLevel: ScaleLevelSchema.default(0),
			reduceAnimations: z.boolean().default(false),
		})
		.default({}),
	wiki: z
		.object({
			expandedFolders: z.array(z.string()).default([]),
			visibleEntities: z
				.array(z.enum(['article', 'actor', 'event', 'tag']))
				.default(['article', 'actor', 'event', 'tag']),
		})
		.default({}),
	imageGenerator: z
		.object({
			lastPrompt: z.string().default(''),
		})
		.default({}),
})

export const loadPreferences = () => {
	const sessionValue = window.sessionStorage.getItem(PreferencesKey)
	if (sessionValue) {
		try {
			return PreferencesStateSchema.parse(JSON.parse(sessionValue))
		} catch (error) {
			console.warn('Failed to load preferences from session storage:', error)
		}
	}

	const value = window.localStorage.getItem(PreferencesKey)
	if (!value) {
		return DefaultPreferencesValue
	}

	try {
		return PreferencesStateSchema.parse(JSON.parse(value))
	} catch (error) {
		console.warn('Failed to load preferences from local storage:', error)
	}
	return DefaultPreferencesValue
}

export type SavedPreferencesShape = z.infer<typeof PreferencesStateSchema>
export const DefaultPreferencesValue = PreferencesStateSchema.parse({})
