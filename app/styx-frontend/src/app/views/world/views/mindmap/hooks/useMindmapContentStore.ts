import { useCallback, useSyncExternalStore } from 'react'

import {
	EntityStore,
	mindmapExistingWireStore,
	mindmapNodeStore,
	mindmapWireStore,
} from '../utils/MindmapContentStore'

export function useMindmapNode(nodeId: string) {
	return useStoreEntity(mindmapNodeStore, nodeId)
}

export function useMindmapWire(wireId: string) {
	return useStoreEntity(mindmapWireStore, wireId)
}

export function useMindmapNodeIds() {
	return useStoreIds(mindmapNodeStore)
}

export function useMindmapWireIds() {
	return useStoreIds(mindmapWireStore)
}

export function useMindmapExistingWires() {
	return useSyncExternalStore(mindmapExistingWireStore.subscribe, mindmapExistingWireStore.get)
}

function useStoreEntity<T>(store: EntityStore<T>, id: string) {
	const subscribe = useCallback((listener: () => void) => store.subscribe(id, listener), [store, id])
	const getSnapshot = useCallback(() => store.get(id), [store, id])
	return useSyncExternalStore(subscribe, getSnapshot)
}

function useStoreIds<T>(store: EntityStore<T>) {
	return useSyncExternalStore(store.subscribeToIds, store.getIds)
}
