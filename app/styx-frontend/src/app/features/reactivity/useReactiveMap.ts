import { useCallback, useSyncExternalStore } from 'react'

import { Listener, ReactiveMap } from './ReactiveMap'

export function useReactiveMapValue<Key, Value>(map: ReactiveMap<Key, Value>, key: Key) {
	const subscribe = useCallback(
		(listener: Listener) => {
			return map.subscribe(key, listener)
		},
		[map, key],
	)
	return useSyncExternalStore(subscribe, () => map.get(key))
}

export function useReactiveMapKeys<Key, Value>(map: ReactiveMap<Key, Value>) {
	const subscribe = useCallback(
		(listener: Listener) => {
			return map.subscribeToKeys(listener)
		},
		[map],
	)
	return useSyncExternalStore(subscribe, () => map.keys())
}
