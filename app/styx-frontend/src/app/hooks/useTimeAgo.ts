import { useCallback, useSyncExternalStore } from 'react'

import { formatTimeAgo } from '@/app/utils/formatTimeAgo'

const TICK_INTERVAL = 30 * 1000

const subscribers = new Set<() => void>()
let interval: number | undefined

export function useTimeAgo(date: Date): string {
	const timestamp = date.getTime()
	const getSnapshot = useCallback(() => formatTimeAgo(new Date(timestamp)), [timestamp])

	return useSyncExternalStore(subscribe, getSnapshot)
}

function subscribe(onChange: () => void) {
	subscribers.add(onChange)
	interval ??= window.setInterval(() => subscribers.forEach((callback) => callback()), TICK_INTERVAL)

	return () => {
		subscribers.delete(onChange)
		if (subscribers.size === 0) {
			window.clearInterval(interval)
			interval = undefined
		}
	}
}
