import { hashCode } from '@/app/utils/hashCode'

/** Accent ramp from the design system: purple, blue, amber, pink, teal, ember. */
const AccentColors = ['#9275d7', '#60a5fa', '#f8c569', '#f472b6', '#14b8a6', '#ce7259']

/**
 * Stable accent color for an entity that carries no color of its own, derived from its id.
 */
export function getAccentColor(id: string) {
	return AccentColors[Math.abs(hashCode(id)) % AccentColors.length]
}
