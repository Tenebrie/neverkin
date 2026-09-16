import { EsotericDate } from '@neverkin/esoteric-date'
import { useCallback } from 'react'

import { parseTimeSelector } from '../utils/parseTimeSelector'
import { useWorldTime } from './useWorldTime'

export const useTimeSelector = ({ rawTime }: { rawTime: number }) => {
	const { calendar } = useWorldTime()
	const applySelector = useCallback(
		(selector: string) => {
			const timeDeltas = parseTimeSelector(calendar, selector)

			const newTime = timeDeltas.reduce(
				(acc, delta) => {
					if (!delta.unit) {
						return acc
					}

					let newValue = acc
					if (delta.set !== null) {
						const curr = newValue.get(delta.unit)
						if (!curr) {
							return acc
						}
						newValue = newValue.step(delta.unit, delta.set - curr.value)
					}
					if (delta.add) {
						newValue = newValue.step(delta.unit, delta.add)
					}
					if (delta.exact) {
						newValue = newValue.floor(delta.unit)
					}
					return newValue
				},
				new EsotericDate(calendar, rawTime),
			)

			return {
				timestamp: newTime.getTimestamp(),
			}
		},
		[calendar, rawTime],
	)

	return {
		applySelector,
	}
}
